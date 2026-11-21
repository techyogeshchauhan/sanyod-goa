import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { contactSchema, type ContactInput } from '@shared/schemas/forms';
import { formsApi } from '@/api/forms';
import { FieldError } from '@/components/common/FieldError';
import { applyApiError } from '@/utils/forms';

/** "Send your message" form: saved and emailed to the admin. */
export function ContactForm() {
  const [status, setStatus] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      const { message } = await formsApi.contact(values);
      setStatus({ type: 'success', text: message });
      reset();
    } catch (err) {
      setStatus({ type: 'danger', text: applyApiError(err, setError) });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
      <input type="text" tabIndex={-1} autoComplete="off" className="d-none" aria-hidden="true" {...register('website')} />
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="name" className="form-label">
            Your name
          </label>
          <input type="text" className="form-control" id="name" autoComplete="name" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="col-md-6">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input type="email" className="form-control" id="email" autoComplete="email" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="col-md-6">
          <label htmlFor="phone" className="form-label">
            Phone <span className="text-muted fw-normal">(optional)</span>
          </label>
          <input type="tel" className="form-control" id="phone" autoComplete="tel" {...register('phone')} />
        </div>
        <div className="col-md-6">
          <label htmlFor="project" className="form-label">
            Topic <span className="text-muted fw-normal">(optional)</span>
          </label>
          <input type="text" className="form-control" id="project" placeholder="Course, book, retreat…" {...register('project')} />
        </div>
        <div className="col-12">
          <label htmlFor="subject" className="form-label">
            Subject
          </label>
          <input type="text" className="form-control" id="subject" {...register('subject')} />
          <FieldError message={errors.subject?.message} />
        </div>
        <div className="col-12">
          <label htmlFor="message" className="form-label">
            Message
          </label>
          <textarea className="form-control" id="message" rows={6} placeholder="How can we help you?" {...register('message')} />
          <FieldError message={errors.message?.message} />
        </div>
        <div className="col-12">
          <button className="btn btn-primary btn-lg w-100" disabled={isSubmitting}>
            {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane"></i> Send message</>}
          </button>
        </div>
      </div>
    </form>
  );
}
