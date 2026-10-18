import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { adminLoginSchema, type AdminLoginInput } from '@shared/schemas/auth';
import { FieldError } from '@/components/common/FieldError';
import { applyApiError } from '@/utils/forms';
import { AdminChrome } from '../AdminLayout';
import { useAdminAuth } from '../AdminAuth';

/** admin/login.php: "Please Sign in" panel (username, password, Remember Me). */
export default function AdminLoginPage() {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setErrorText] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(adminLoginSchema), defaultValues: { remember: false } });

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/admin';
  if (admin) return <Navigate to={from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin'} replace />;

  const onSubmit = handleSubmit(async (values) => {
    setErrorText(null);
    try {
      await login(values);
      navigate(from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin', { replace: true });
    } catch (err) {
      setErrorText(applyApiError(err, setError));
    }
  });

  return (
    <>
      <AdminChrome />
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="text-center mt-5">
              <span className="pppht">SANYOD Admin</span>
            </div>
            <form className="form loginform" onSubmit={onSubmit} noValidate>
              <div className="login-panel card mt-4">
                <div className="panel-heading">Please Sign in</div>
                <div className="card-body p-4">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label" htmlFor="username">Username</label>
                    <input id="username" type="text" className="form-control" autoComplete="username" autoFocus {...register('username')} />
                    <FieldError message={errors.username?.message} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input id="password" type="password" className="form-control" autoComplete="current-password" {...register('password')} />
                    <FieldError message={errors.password?.message} />
                  </div>
                  <div className="form-check mb-3">
                    <input id="remember" type="checkbox" className="form-check-input" {...register('remember')} />
                    <label className="form-check-label" htmlFor="remember">Remember Me</label>
                  </div>
                  <button type="submit" className="btn btn-admin w-100 py-2" disabled={isSubmitting}>
                    {isSubmitting ? <span className="spinner-border spinner-border-sm"></span> : 'Login'}
                  </button>
                </div>
              </div>
            </form>
            <p className="text-center text-muted small mt-3">
              <a href="/" className="text-muted">← Back to website</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
