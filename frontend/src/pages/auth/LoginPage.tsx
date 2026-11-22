import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@shared/schemas/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { FieldError } from '@/components/common/FieldError';
import { useAuth } from '@/providers/AuthProvider';
import { redirectTarget } from '@/routes/guards';
import { applyApiError } from '@/utils/forms';
import { PasswordInput } from '@/components/common/PasswordInput';

/** User login (login.php). Returns to the page that asked for a login. */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      navigate(redirectTarget(location.state), { replace: true });
    } catch (err) {
      setError(applyApiError(err, setFieldError));
    }
  });

  return (
    <AuthShell
      cardClass="login-card"
      icon="fas fa-sign-in-alt"
      title="Welcome back"
      subtitle="Log in to continue your courses, read your books and track your orders."
      footer={
        <>
          New to SANYOD?{' '}
          <Link to="/register" state={location.state} className="fw-600">
            Create a free account
          </Link>
          <div className="small mt-2">
            Site administrator?{' '}
            <Link to="/admin/login" className="fw-600">
              <i className="fas fa-user-shield" aria-hidden="true"></i> Admin login
            </Link>
          </div>
        </>
      }
    >
      {error && <div className="alert alert-danger">{error}</div>}
      <form autoComplete="on" onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input type="email" id="email" className="form-control" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-baseline">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <Link to="/forgot-password" className="small fw-600">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" placeholder="Your password" autoComplete="current-password" {...register('password')} />
          <FieldError message={errors.password?.message} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-100 mt-3" disabled={isSubmitting}>
          {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'Login'}
        </button>
      </form>
    </AuthShell>
  );
}
