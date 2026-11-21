import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@shared/schemas/auth';
import { authApi } from '@/api/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { FieldError } from '@/components/common/FieldError';
import { applyApiError } from '@/utils/forms';

/** Forgot password (forget.php). The reset link is emailed, never shown on screen (D-13). */
export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  useEffect(() => setFocus('email'), [setFocus]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await authApi.forgotPassword(values);
      setSentTo(values.email);
    } catch (err) {
      setError(applyApiError(err, setFieldError));
    }
  });

  return (
    <AuthShell
      cardClass="forget-card"
      icon="fas fa-key"
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to set a new password."
      footer={
        <>
          Remember your password?{' '}
          <Link to="/login" className="fw-600">
            Back to login
          </Link>
        </>
      }
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {sentTo ? (
        <div className="alert alert-success">
          <h2 className="h5 mb-2">
            <i className="fas fa-envelope-open-text me-2"></i>Check Your Email
          </h2>
          <p className="mb-2">
            If <strong>{sentTo}</strong> is registered with us, we have sent a password reset link to it.
          </p>
          <p className="mb-0">The link is valid for 1 hour. Please also check your spam folder.</p>
        </div>
      ) : (
        <form autoComplete="on" onSubmit={onSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input type="email" id="email" className="form-control" placeholder="you@example.com" autoComplete="email" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <ol className="steps list-unstyled small mb-4">
            {['Enter your registered email', 'Open the link we send to your inbox', 'Choose a new password'].map((s, i) => (
              <li className="step align-items-center" key={s}>
                <span className="step-num" style={{ width: 30, height: 30, fontSize: '0.85rem' }}>
                  {i + 1}
                </span>
                <span className="text-muted">{s}</span>
              </li>
            ))}
          </ol>
          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isSubmitting}>
            {isSubmitting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Send reset link
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
