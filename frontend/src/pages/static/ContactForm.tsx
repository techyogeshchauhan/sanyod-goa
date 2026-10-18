import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { contactSchema, type ContactInput } from '@shared/schemas/forms';
import { formsApi } from '@/api/forms';
import { FieldError } from '@/components/common/FieldError';
import { applyApiError } from '@/utils/forms';

/** "Send Your Message" form (contact.php). Same markup; it now actually sends (allowed adjustment A2). */
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
    <form onSubmit={onSubmit}>
      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
      <input type="text" tabIndex={-1} autoComplete="off" className="d-none" aria-hidden="true" {...register('website')} />
      <div className="row g-4">
        <div className="col-lg-12 col-xl-6">
          <div className="form-floating">
            <input type="text" className="form-control" id="name" placeholder="Your Name" required {...register('name')} />{' '}
            <label htmlFor="name">Your Name</label>
            <FieldError message={errors.name?.message} />
          </div>
        </div>
        <div className="col-lg-12 col-xl-6">
          <div className="form-floating">
            <input type="email" className="form-control" id="email" placeholder="Your Email" required {...register('email')} />{' '}
            <label htmlFor="email">Your Email</label>
            <FieldError message={errors.email?.message} />
          </div>
        </div>
        <div className="col-lg-12 col-xl-6">
          <div className="form-floating">
            <input type="phone" className="form-control" id="phone" placeholder="Phone" {...register('phone')} />{' '}
            <label htmlFor="phone">Your Phone</label>
          </div>
        </div>
        <div className="col-lg-12 col-xl-6">
          <div className="form-floating">
            <input type="text" className="form-control" id="project" placeholder="Project" {...register('project')} />{' '}
            <label htmlFor="project">Your Project</label>
          </div>
        </div>
        <div className="col-12">
          <div className="form-floating">
            <input type="text" className="form-control" id="subject" placeholder="Subject" required {...register('subject')} />{' '}
            <label htmlFor="subject">Subject</label>
            <FieldError message={errors.subject?.message} />
          </div>
        </div>
        <div className="col-12">
          <div className="form-floating">
            <textarea
              className="form-control"
              placeholder="Leave a message here"
              id="message"
              style={{ height: '160px' }}
              required
              {...register('message')}
            />{' '}
            <label htmlFor="message">Message</label>
            <FieldError message={errors.message?.message} />
          </div>
        </div>
        <div className="col-12">
          <button className="btn btn-light w-100 py-3" disabled={isSubmitting}>
            {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'Send Message'}
          </button>
        </div>
      </div>
    </form>
  );
}
