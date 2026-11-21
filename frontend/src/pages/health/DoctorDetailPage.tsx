import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { PREFERRED_TIME_LABELS, PREFERRED_TIMES } from '@shared/constants';
import { consultationSchema } from '@shared/schemas/purchases';
import type { DoctorDetail } from '@shared/types/catalog';
import { healthApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { DoctorPhoto } from '@/components/common/DoctorPhoto';
import { FieldError } from '@/components/common/FieldError';
import { PageError } from '@/components/common/PageState';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import NotFoundPage from '@/pages/NotFoundPage';
import { applyApiError } from '@/utils/forms';
import { rupees } from '@/utils/format';

const CATEGORY_LABEL = { physical: 'Physical health', mental: 'Mental health', chronical: 'Chronic disease' } as const;

const formSchema = consultationSchema.omit({ doctorSlug: true });
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const today = () => new Date().toISOString().slice(0, 10);

/** Doctor profile + "Book Consultation" form (doctor_detail.php). */
export default function DoctorDetailPage() {
  const { slug = '' } = useParams();
  const { data: doctor, isLoading, error } = useQuery({ queryKey: ['doctor', slug], queryFn: () => healthApi.doctor(slug) });

  if (isLoading) return <Spinner />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error || !doctor) return <PageError error={error} />;
  return <DoctorView doctor={doctor} />;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="text-saffron" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < full ? 'fas fa-star' : i === full && half ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
      ))}
    </span>
  );
}

function DoctorView({ doctor }: { doctor: DoctorDetail }) {
  const consultRef = useRef<HTMLDivElement>(null);
  const firstCategory = doctor.categories[0];
  const otherSpecialisations = doctor.categories
    .slice(1)
    .filter((c) => c.specialisations && c.specialisations !== firstCategory?.specialisations);
  const scrollToForm = () => consultRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <section className="page-hero compact">
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>
              <Link to="/health">Health</Link>
            </span>
            <span>Dr. {doctor.name}</span>
          </nav>
          <div className="row g-5 align-items-center">
            <div className="col-md-5 col-lg-4">
              <div className="doctor-photo-lg mx-auto" style={{ maxWidth: 340 }}>
                <DoctorPhoto src={doctor.photo} alt={`Dr. ${doctor.name}`} />
              </div>
            </div>
            <div className="col-md-7 col-lg-8">
              <div className="d-flex flex-wrap gap-2 mb-3">
                {doctor.categories.map((c) => (
                  <span key={c.category} className="chip indigo">
                    {CATEGORY_LABEL[c.category]}
                  </span>
                ))}
                {doctor.isVerified && (
                  <span className="chip sage">
                    <i className="fas fa-check-circle"></i> Verified
                  </span>
                )}
                {doctor.availabilityText && (
                  <span className="chip gold">
                    <i className="far fa-clock"></i> {doctor.availabilityText}
                  </span>
                )}
              </div>
              <h1 className="mb-2">Dr. {doctor.name}</h1>
              {firstCategory?.specialisations && <p className="lead deva mb-3">{firstCategory.specialisations}</p>}
              {doctor.rating != null && (
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Stars rating={doctor.rating} />
                  <span className="fw-600 text-ink">{doctor.rating}</span>
                </div>
              )}
              <ul className="meta-list mb-4">
                {doctor.qualification && (
                  <li>
                    <i className="fas fa-graduation-cap"></i> {doctor.qualification}
                  </li>
                )}
                {doctor.experienceYears != null && (
                  <li>
                    <i className="fas fa-briefcase"></i> {doctor.experienceYears} years experience
                  </li>
                )}
                <li>
                  <i className="fas fa-money-bill-wave"></i> {rupees(doctor.fee, false)} consultation fee
                </li>
              </ul>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-primary" type="button" onClick={scrollToForm}>
                  <i className="fas fa-comments"></i> Consult doctor
                </button>
                {doctor.hasCv && (
                  <a href={healthApi.cvUrl(doctor.slug)} className="btn btn-light" target="_blank" rel="noopener">
                    <i className="fas fa-file-download"></i> Download CV
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-8">
              {(doctor.bio || otherSpecialisations.length > 0) && (
                <div className="card-flat prose mb-4">
                  <h2 className="h4 mb-3">About Dr. {doctor.name}</h2>
                  {doctor.bio && <p>{doctor.bio}</p>}
                  {otherSpecialisations.map((c) => (
                    <p key={c.category} className="deva">
                      <strong>{CATEGORY_LABEL[c.category]}:</strong> {c.specialisations}
                    </p>
                  ))}
                </div>
              )}

              <div id="consult-section" className="card-flat" ref={consultRef}>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <span className="icon-badge sage mb-0">
                    <i className="fas fa-calendar-check"></i>
                  </span>
                  <div>
                    <h2 className="h4 mb-0">Book a consultation</h2>
                    <p className="text-muted small mb-0">Fill in the form to consult with Dr. {doctor.name}.</p>
                  </div>
                </div>
                <div className="divider"></div>
                <ConsultationForm doctor={doctor} anchor={consultRef} />
              </div>
            </div>

            <div className="col-lg-4">
              <div className="sticky-aside d-grid gap-4">
                <div className="card-flat">
                  <div className="small text-muted mb-1">Consultation fee</div>
                  <div className="price mb-3">{rupees(doctor.fee, false)}</div>
                  <ul className="check-list small mb-4">
                    <li>Online (video / phone) consultation</li>
                    <li>The doctor confirms the time by email or phone</li>
                    <li>Response within 24 hours</li>
                  </ul>
                  <button className="btn btn-primary w-100" type="button" onClick={scrollToForm}>
                    <i className="fas fa-calendar-plus"></i> Book now
                  </button>
                </div>
                <div className="card-flat">
                  <h3 className="h5">
                    <i className="fas fa-info-circle text-indigo me-2"></i>About online consultation
                  </h3>
                  <p className="small text-muted mb-0">
                    Book a virtual consultation with Dr. {doctor.name} from the comfort of your home. After booking, the doctor will contact you via
                    email/phone to confirm the consultation details.
                  </p>
                </div>
                <p className="small text-muted text-center mb-0">
                  <i className="fas fa-shield-alt text-sage me-1"></i> Your information is secure and confidential.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
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
      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor="patientName">Full name *</label>
          <input id="patientName" type="text" className="form-control" placeholder="Enter your full name" {...register('patientName')} />
          <FieldError message={errors.patientName?.message} />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="patientEmail">Email *</label>
          <input id="patientEmail" type="email" className="form-control" placeholder="Enter your email" {...register('patientEmail')} />
          <FieldError message={errors.patientEmail?.message} />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="patientPhone">Phone number *</label>
          <input
            id="patientPhone"
            type="text"
            inputMode="numeric"
            className="form-control"
            placeholder="10-digit phone number"
            {...register('patientPhone', { onChange: (e) => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)) })}
          />
          <FieldError message={errors.patientPhone?.message} />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="patientAge">Age *</label>
          <input id="patientAge" type="number" min={1} max={120} className="form-control" placeholder="Enter your age" {...register('patientAge')} />
          <FieldError message={errors.patientAge?.message} />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="medicalIssue">Medical issue / concern *</label>
          <input id="medicalIssue" type="text" className="form-control" placeholder="e.g., Headache, Fever, Diabetes, etc." {...register('medicalIssue')} />
          <FieldError message={errors.medicalIssue?.message} />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="appointmentDate">Appointment date *</label>
          <input id="appointmentDate" type="date" className="form-control" min={today()} {...register('appointmentDate')} />
          <FieldError message={errors.appointmentDate?.message} />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="preferredTime">Preferred consultation time *</label>
          <select id="preferredTime" className="form-select" defaultValue="" {...register('preferredTime')}>
            <option value="">Select preferred time</option>
            {PREFERRED_TIMES.map((t) => (
              <option key={t} value={t}>
                {PREFERRED_TIME_LABELS[t]}
              </option>
            ))}
          </select>
          <FieldError message={errors.preferredTime?.message} />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="additionalNotes">Additional notes (optional)</label>
          <textarea id="additionalNotes" className="form-control" rows={2} placeholder="Existing conditions, medications..." {...register('additionalNotes')} />
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="symptoms">Symptoms *</label>
          <textarea id="symptoms" className="form-control" rows={4} placeholder="Describe your symptoms in detail (onset, duration, severity, etc.)" {...register('symptoms')} />
          <div className="form-text">Please be as detailed as possible about your symptoms.</div>
          <FieldError message={errors.symptoms?.message} />
        </div>
        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="terms" {...register('consentAccepted')} />
            <label className="form-check-label" htmlFor="terms">
              I confirm that all information provided is accurate and I consent to teleconsultation
            </label>
            <FieldError message={errors.consentAccepted?.message} />
          </div>
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-success btn-lg w-100" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span> Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Submit Consultation Request
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
