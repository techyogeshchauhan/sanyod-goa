import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterInput } from '@shared/schemas/auth';
import { FieldError } from '@/components/common/FieldError';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import { redirectTarget } from '@/routes/guards';
import { applyApiError } from '@/utils/forms';
import '@/styles/pages/register.page.css';

/** User registration (register.php). Signs the user in and returns to the requested page (D-04). */
export default function RegisterPage() {
  useBodyClass('page-register');
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
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="register-card card shadow-sm">
            <div className="card-header">User Registration</div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form method="POST" onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input type="text" id="name" className="form-control" placeholder="Enter your full name" required {...register('name')} />
                  <FieldError message={errors.name?.message} />
                </div>
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
                  <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                    Register
                  </button>
                </div>
              </form>

              <div className="mt-3 text-center">
                <Link to="/login" state={location.state}>
                  Already have an account? Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
