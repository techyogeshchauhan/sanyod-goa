import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { PREFERRED_TIME_LABELS, PREFERRED_TIMES } from '@shared/constants';
import { consultationSchema } from '@shared/schemas/purchases';
import type { DoctorDetail } from '@shared/types/catalog';
import { healthApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { DoctorPhoto } from '@/components/common/DoctorPhoto';
import { FieldError } from '@/components/common/FieldError';
import { PageError, PageLoading } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import NotFoundPage from '@/pages/NotFoundPage';
import { applyApiError } from '@/utils/forms';
import { rupees } from '@/utils/format';
import '@/styles/pages/doctor-detail.page.css';

const CATEGORY_LABEL = { physical: 'Physical', mental: 'Mental', chronical: 'Chronic' } as const;

const formSchema = consultationSchema.omit({ doctorSlug: true });
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const today = () => new Date().toISOString().slice(0, 10);

/** Doctor profile + "Book Consultation" form (doctor_detail.php). */
export default function DoctorDetailPage() {
  useBodyClass('page-doctor-detail');
  const { slug = '' } = useParams();
  const { data: doctor, isLoading, error } = useQuery({ queryKey: ['doctor', slug], queryFn: () => healthApi.doctor(slug) });

  if (isLoading) return <PageLoading />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error || !doctor) return <PageError error={error} />;
  return <DoctorView doctor={doctor} />;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="rating-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < full ? 'fas fa-star' : i === full && half ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
      ))}
    </div>
  );
}

function DoctorView({ doctor }: { doctor: DoctorDetail }) {
  const consultRef = useRef<HTMLDivElement>(null);
  const firstCategory = doctor.categories[0];

  return (
    <div className="container mt-4">
      <div className="doctor-container">
        <div className="row">
          <div className="col-md-4">
            <div className="doctor-image">
              <DoctorPhoto src={doctor.photo} alt={`Dr. ${doctor.name}`} />
            </div>
          </div>
          <div className="col-md-8">
            <div className="doctor-details">
              <h1 className="doctor-name">Dr. {doctor.name}</h1>
              <p className="doctor-specialization">{firstCategory?.specialisations}</p>
              <div className="rating">
                {doctor.rating != null && (
                  <>
                    <Stars rating={doctor.rating} />
                    <span className="rating-value">{doctor.rating}</span>
                  </>
                )}
                {doctor.isVerified && <span className="badge badge-success">Verified</span>}
                {doctor.availabilityText && <span className="badge badge-primary">{doctor.availabilityText}</span>}
              </div>
              <div className="doctor-meta">
                <div className="meta-item">
                  <i className="fas fa-user-md"></i> {doctor.categories.map((c) => CATEGORY_LABEL[c.category]).join(', ')}
                </div>
                {doctor.qualification && (
                  <div className="meta-item">
                    <i className="fas fa-graduation-cap"></i> {doctor.qualification}
                  </div>
                )}
                {doctor.experienceYears != null && (
                  <div className="meta-item">
                    <i className="fas fa-briefcase"></i> {doctor.experienceYears} years experience
                  </div>
                )}
                <div className="meta-item">
                  <i className="fas fa-money-bill-wave"></i> {rupees(doctor.fee, false)} Fee
                </div>
              </div>
              {doctor.bio && <div className="doctor-description">{doctor.bio}</div>}
              {doctor.categories.slice(1).some((c) => c.specialisations && c.specialisations !== firstCategory?.specialisations) && (
                <div className="doctor-description">
                  {doctor.categories.slice(1).filter((c) => c.specialisations && c.specialisations !== firstCategory?.specialisations).map((c) => (
                    <p key={c.category} className="mb-2">
                      <strong>{CATEGORY_LABEL[c.category]}:</strong> {c.specialisations}
                    </p>
                  ))}
                </div>
              )}
              <div
                className="info-box"
                style={{ background: '#e8f4fc', padding: '1.5rem', borderRadius: '10px', margin: '1rem 0', borderLeft: '4px solid var(--primary)' }}
              >
                <h5 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  <i className="fas fa-info-circle"></i> About Online Consultation
                </h5>
                <p className="mb-0">
                  Book a virtual consultation with Dr. {doctor.name} from the comfort of your home. After booking, the doctor will contact you via
                  email/phone to confirm the consultation details.
                </p>
              </div>
              <div className="action-buttons mb-3">
                {doctor.hasCv && (
                  <a href={healthApi.cvUrl(doctor.slug)} className="btn btn-outline" target="_blank" rel="noopener">
                    <i className="fas fa-file-download"></i> Download CV
                  </a>
                )}{' '}
                <button className="btn btn-primary" type="button" onClick={() => consultRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                  <i className="fas fa-comments"></i> Consult Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="consult-section" className="consult-section mt-5" ref={consultRef}>
        <h3>
          <i className="fas fa-calendar-check"></i> Book Consultation
        </h3>
        <p className="text-muted">Fill the form below to consult with Dr. {doctor.name}.</p>
        <ConsultationForm doctor={doctor} anchor={consultRef} />
      </div>

      <div className="mt-4 text-center">
        <p className="text-muted">
          <i className="fas fa-shield-alt"></i> Your information is secure and confidential. Doctor will contact you within 24 hours.
        </p>
      </div>
    </div>
  );
}

function ConsultationForm({ doctor, anchor }: { doctor: DoctorDetail; anchor: React.RefObject<HTMLDivElement | null> }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: { patientName: user?.name ?? '', patientEmail: user?.email ?? '', preferredTime: undefined, consentAccepted: undefined },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      setStatus(null);
      try {
        const { message } = await healthApi.consult({ ...values, doctorSlug: doctor.slug });
        setStatus({ type: 'success', text: message });
        reset({ patientName: user?.name ?? '', patientEmail: user?.email ?? '' });
        void queryClient.invalidateQueries({ queryKey: ['consultations'] });
      } catch (err) {
        setStatus({ type: 'danger', text: applyApiError(err, setError) });
      }
      anchor.current?.scrollIntoView({ behavior: 'smooth' });
    },
    () => anchor.current?.scrollIntoView({ behavior: 'smooth' }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      {status && <div className={`alert-${status.type}`}>{status.text}</div>}
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label className="required-field" htmlFor="patientName">Full Name</label>
            <input id="patientName" type="text" className="form-control" placeholder="Enter your full name" {...register('patientName')} />
            <FieldError message={errors.patientName?.message} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <label className="required-field" htmlFor="patientEmail">Email</label>
            <input id="patientEmail" type="email" className="form-control" placeholder="Enter your email" {...register('patientEmail')} />
            <FieldError message={errors.patientEmail?.message} />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label className="required-field" htmlFor="patientPhone">Phone Number</label>
            <input
              id="patientPhone"
              type="text"
              inputMode="numeric"
              className="form-control"
              placeholder="Enter your phone number"
              {...register('patientPhone', { onChange: (e) => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)) })}
            />
            <FieldError message={errors.patientPhone?.message} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <label className="required-field" htmlFor="patientAge">Age</label>
            <input id="patientAge" type="number" min={1} max={120} className="form-control" placeholder="Enter your age" {...register('patientAge')} />
            <FieldError message={errors.patientAge?.message} />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label className="required-field" htmlFor="medicalIssue">Medical Issue/Concern</label>
            <input id="medicalIssue" type="text" className="form-control" placeholder="e.g., Headache, Fever, Diabetes, etc." {...register('medicalIssue')} />
            <FieldError message={errors.medicalIssue?.message} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <label className="required-field" htmlFor="appointmentDate">Appointment Date</label>
            <input id="appointmentDate" type="date" className="form-control" min={today()} {...register('appointmentDate')} />
            <FieldError message={errors.appointmentDate?.message} />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label className="required-field" htmlFor="preferredTime">Preferred Consultation Time</label>
            <select id="preferredTime" className="form-control" defaultValue="" {...register('preferredTime')}>
              <option value="">Select preferred time</option>
              {PREFERRED_TIMES.map((t) => (
                <option key={t} value={t}>{PREFERRED_TIME_LABELS[t]}</option>
              ))}
            </select>
            <FieldError message={errors.preferredTime?.message} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <label htmlFor="additionalNotes">Additional Notes (Optional)</label>
            <textarea id="additionalNotes" className="form-control" rows={3} placeholder="Any other information, existing conditions, or medications..." {...register('additionalNotes')} />
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="required-field" htmlFor="symptoms">Symptoms</label>
        <textarea id="symptoms" className="form-control" rows={4} placeholder="Describe your symptoms in detail (onset, duration, severity, etc.)" {...register('symptoms')} />
        <small className="text-muted">Please be as detailed as possible about your symptoms</small>
        <FieldError message={errors.symptoms?.message} />
      </div>
      <div className="form-group">
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="terms" {...register('consentAccepted')} />
          <label className="form-check-label" htmlFor="terms">
            I confirm that all information provided is accurate and I consent to teleconsultation
          </label>
          <FieldError message={errors.consentAccepted?.message} />
        </div>
      </div>
      <button type="submit" className="btn btn-success w-100 py-3" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status"></span> Submitting...
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane"></i> Submit Consultation Request
          </>
        )}
      </button>
    </form>
  );
}
