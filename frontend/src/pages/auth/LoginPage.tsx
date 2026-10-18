import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@shared/schemas/auth';
import { FieldError } from '@/components/common/FieldError';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import { redirectTarget } from '@/routes/guards';
import { applyApiError } from '@/utils/forms';
import '@/styles/pages/login.page.css';

/** User login (login.php). */
export default function LoginPage() {
  useBodyClass('page-login');
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
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="login-card card shadow-sm">
            <div className="card-header">User Login</div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form method="POST" autoComplete="off" onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <input type="email" id="email" className="form-control" placeholder="Enter your email" required {...register('email')} />
                  <FieldError message={errors.email?.message} />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    placeholder="Enter your password"
                    required
                    {...register('password')}
                  />
                  <FieldError message={errors.password?.message} />
                </div>
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    Login
                  </button>
                </div>
              </form>

              <div className="mt-3 text-center">
                <Link to="/register" state={location.state}>
                  Don't have an account? Register
                </Link>
              </div>
              <div className="mt-3 text-center">
                <Link to="/forgot-password">forget</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
