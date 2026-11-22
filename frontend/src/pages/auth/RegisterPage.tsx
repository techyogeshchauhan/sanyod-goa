import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';
import { PASSWORD_MIN_LENGTH } from '@shared/constants';
import { registerSchema, type RegisterInput } from '@shared/schemas/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { FieldError } from '@/components/common/FieldError';
import { useAuth } from '@/providers/AuthProvider';
import { applyApiError } from '@/utils/forms';
import { PasswordInput } from '@/components/common/PasswordInput';

/** User registration (register.php). Returns the same next step for existing and new email addresses. */
export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await registerUser(values);
      setSubmitted(true);
    } catch (err) {
      setError(applyApiError(err, setFieldError));
    }
  });

  return (
    <AuthShell
      cardClass="register-card"
      icon="fas fa-user-plus"
      title="Create your account"
      subtitle="Free to join. Buy books and courses, book programmes and consultations."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="fw-600">
            Log in
          </Link>
        </>
      }
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {submitted ? (
        <div className="alert alert-success" role="status">
          <p className="mb-3">If this address was available, your account is ready. If you already have an account, sign in or reset your password.</p>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/login" state={location.state} className="btn btn-primary">Sign in</Link>
            <Link to="/forgot-password" className="btn btn-light">Reset password</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Full name
          </label>
          <input type="text" id="name" className="form-control" placeholder="Your full name" autoComplete="name" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input type="email" id="email" className="form-control" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="mb-2">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <PasswordInput
            id="password"
            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
            autoComplete="new-password"
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-100 mt-3" disabled={isSubmitting}>
          {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'Register'}
        </button>
        </form>
      )}
    </AuthShell>
  );
}
