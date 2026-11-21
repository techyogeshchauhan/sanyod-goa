import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import type { PREFERRED_MENTORS } from '@shared/constants';
import { guidanceRequestSchema, type GuidanceRequestInput, type SessionPlan } from '@shared/schemas/forms';
import { formsApi } from '@/api/forms';
import { FieldError } from '@/components/common/FieldError';
import { applyApiError } from '@/utils/forms';

export interface BookingRequest {
  mentor?: (typeof PREFERRED_MENTORS)[number];
  plan?: SessionPlan;
}

const PLAN_LABEL: Record<SessionPlan, string> = {
  'one-on-one': 'One-on-One Video Sessions',
  monthly: 'Monthly Mentorship',
  group: 'Group Guidance',
};

/** "Book your free consultation" dialog: saved as a guidance request and emailed to the admin. */
export function GuidanceConsultationModal({ request, onClose }: { request: BookingRequest; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<GuidanceRequestInput>({
    resolver: zodResolver(guidanceRequestSchema),
    defaultValues: { preferredMentor: request.mentor, plan: request.plan },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const { message } = await formsApi.guidanceRequest(values);
      setDone(message);
    } catch (err) {
      setError(applyApiError(err, setFieldError));
    }
  });

  return createPortal(
    <div
      className="modal d-block consultation-modal"
      style={{ background: 'rgba(30,27,46,0.55)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-title"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="consultation-title">
              Book your free consultation
            </h5>
            <button type="button" className="btn-close close-modal" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {done ? (
              <div className="text-center py-3">
                <span className="icon-badge sage lg">
                  <i className="fas fa-check"></i>
                </span>
                <h3 className="h4">Request received</h3>
                <p className="text-muted">{done}</p>
                <button type="button" className="btn btn-primary" onClick={onClose}>
                  Close
                </button>
              </div>
            ) : (
              <form id="consultation-form" onSubmit={onSubmit} noValidate>
                {request.plan && (
                  <div className="alert alert-light py-2 small">
                    Plan: <strong>{PLAN_LABEL[request.plan]}</strong>
                  </div>
                )}
                {error && <div className="alert alert-danger">{error}</div>}
                <input type="text" tabIndex={-1} autoComplete="off" className="d-none" aria-hidden="true" {...register('website')} />
                <div className="mb-3">
                  <label className="form-label" htmlFor="gc-name">
                    Your name
                  </label>
                  <input id="gc-name" type="text" className="form-control" autoComplete="name" {...register('name')} />
                  <FieldError message={errors.name?.message} />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="gc-email">
                    Email address
                  </label>
                  <input id="gc-email" type="email" className="form-control" autoComplete="email" {...register('email')} />
                  <FieldError message={errors.email?.message} />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="gc-mentor">
                    Preferred mentor
                  </label>
                  <select id="gc-mentor" className="form-select" {...register('preferredMentor')}>
                    <option value="">Select a mentor</option>
                    <option value="swami">Swami Devanand (Vedanta &amp; Meditation)</option>
                    <option value="priya">Dr. Priya Sharma (Yoga &amp; Ayurveda)</option>
                    <option value="rajan">Acharya Rajan (Scripture &amp; Rituals)</option>
                    <option value="any">Any available mentor</option>
                  </select>
                  <FieldError message={errors.preferredMentor?.message} />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="gc-goals">
                    Your spiritual goals <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <textarea id="gc-goals" className="form-control" rows={3} placeholder="Briefly describe what you are looking for…" {...register('goals')}></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                  {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'Submit request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
