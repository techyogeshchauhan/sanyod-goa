import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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

interface Props {
  request: BookingRequest;
  onClose: () => void;
}

/**
 * "Book Your Free Consultation" modal: same markup and inline styles the live presonal.php
 * script built with innerHTML. On live nothing could open it; here the booking buttons do (A2).
 */
export function GuidanceConsultationModal({ request, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<GuidanceRequestInput>({
    resolver: zodResolver(guidanceRequestSchema),
    defaultValues: { preferredMentor: request.mentor, plan: request.plan },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const { message } = await formsApi.guidanceRequest(values);
      window.alert(message);
      onClose();
    } catch (err) {
      setError(applyApiError(err, setFieldError));
    }
  });

  return createPortal(
    <div
      className="consultation-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-title"
    >
      <div style={{ background: 'white', borderRadius: '25px', padding: '3rem', maxWidth: '500px', width: '100%', position: 'relative' }}>
        <button
          type="button"
          className="close-modal"
          aria-label="Close"
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#FF9933' }}
        >
          ×
        </button>
        <h3 className="text-deep mb-4" id="consultation-title">
          Book Your Free Consultation
        </h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form id="consultation-form" onSubmit={onSubmit}>
          <input type="text" tabIndex={-1} autoComplete="off" className="d-none" aria-hidden="true" {...register('website')} />
          <div className="mb-3">
            <input type="text" className="form-control" placeholder="Your Name" required {...register('name')} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="mb-3">
            <input type="email" className="form-control" placeholder="Email Address" required {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="mb-3">
            <select className="form-control" required {...register('preferredMentor')}>
              <option value="">Select Preferred Mentor</option>
              <option value="swami">Swami Devanand (Vedanta &amp; Meditation)</option>
              <option value="priya">Dr. Priya Sharma (Yoga &amp; Ayurveda)</option>
              <option value="rajan">Acharya Rajan (Scripture &amp; Rituals)</option>
              <option value="any">Any Available Mentor</option>
            </select>
            <FieldError message={errors.preferredMentor?.message} />
          </div>
          <div className="mb-3">
            <textarea className="form-control" rows={3} placeholder="Briefly describe your spiritual goals..." {...register('goals')}></textarea>
          </div>
          <button type="submit" className="btn-guidance w-100" disabled={isSubmitting}>
            {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
