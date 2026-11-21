import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PASSWORD_MIN_LENGTH } from '@shared/constants';
import { registerSchema, type RegisterInput } from '@shared/schemas/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { FieldError } from '@/components/common/FieldError';
import { useAuth } from '@/providers/AuthProvider';
import { redirectTarget } from '@/routes/guards';
import { applyApiError } from '@/utils/forms';

/** User registration (register.php). Signs the user in and returns to the requested page (D-04). */
export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
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
      navigate(redirectTarget(location.state), { replace: true });
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
          <input
            type="password"
            id="password"
            className="form-control"
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
    </AuthShell>
  );
}
