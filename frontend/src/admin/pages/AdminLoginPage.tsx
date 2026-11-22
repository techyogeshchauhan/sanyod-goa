import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { adminLoginSchema, type AdminLoginInput } from '@shared/schemas/auth';
import { FieldError } from '@/components/common/FieldError';
import { PasswordInput } from '@/components/common/PasswordInput';
import { SITE } from '@/config/site';
import { applyApiError } from '@/utils/forms';
import { optimizedSrc } from '@/utils/images';
import { AdminChrome } from '../AdminLayout';
import { useAdminAuth } from '../AdminAuth';

/** What the console is for (shown beside the form). */
const HIGHLIGHTS = [
  { icon: 'fas fa-money-check-alt', text: 'Review payments and ship book orders' },
  { icon: 'fas fa-book-open', text: 'Update books, courses, doctors and programmes' },
  { icon: 'fas fa-envelope-open-text', text: 'Answer consultations, bookings and messages' },
];

/** Admin sign-in (admin/login.php): username, password, Remember Me. */
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
  const target = from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin';
  if (admin) return <Navigate to={target} replace />;

  const onSubmit = handleSubmit(async (values) => {
    setErrorText(null);
    try {
      await login(values);
      navigate(target, { replace: true });
    } catch (err) {
      setErrorText(applyApiError(err, setError));
    }
  });

  return (
    <>
      <AdminChrome />
      <main className="admin-login">
        <div className="admin-login-card">
          <aside className="admin-login-brand">
            <a href="/" className="admin-login-logo" title="Back to the website">
              <span className="logo-chip">
                <img src={optimizedSrc(SITE.logo)} alt="" width={64} height={32} />
              </span>
              <span>
                <span className="logo-name">{SITE.name}</span>
                <span className="logo-tag">Admin console</span>
              </span>
            </a>

            {/* Decorative preview of the console (shapes only, no data). */}
            <div className="admin-login-art" aria-hidden="true">
              <div className="art-window">
                <div className="art-titlebar">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="art-body">
                  <div className="art-side">
                    <i className="art-line is-active"></i>
                    <i className="art-line"></i>
                    <i className="art-line"></i>
                    <i className="art-line short"></i>
                    <i className="art-line"></i>
                  </div>
                  <div className="art-main">
                    <div className="art-tiles">
                      {['fas fa-money-check-alt', 'fas fa-truck', 'fas fa-envelope'].map((icon) => (
                        <div className="art-tile" key={icon}>
                          <i className={icon}></i>
                          <b></b>
                          <s></s>
                        </div>
                      ))}
                    </div>
                    <div className="art-chart">
                      {[38, 62, 46, 80, 56, 92, 70].map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }}></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="art-chip">
                <i className="fas fa-check-circle"></i> Payment approved
              </div>
            </div>

            <div className="admin-login-pitch">
              <h1>Everything behind the website, in one place.</h1>
              <ul>
                {HIGHLIGHTS.map((h) => (
                  <li key={h.text}>
                    <span className="pitch-icon">
                      <i className={h.icon} aria-hidden="true"></i>
                    </span>
                    {h.text}
                  </li>
                ))}
              </ul>
            </div>

            <p className="admin-login-note">
              <i className="fas fa-lock" aria-hidden="true"></i> Authorised staff only
            </p>
          </aside>

          <section className="admin-login-form">
            <div className="form-icon" aria-hidden="true">
              <i className="fas fa-user-shield"></i>
            </div>
            <h2>Sign in</h2>
            <p className="form-lead">Use your admin username and password.</p>

            <form onSubmit={onSubmit} noValidate>
              {error && (
                <div className="alert alert-danger d-flex align-items-start gap-2 py-2" role="alert">
                  <i className="fas fa-exclamation-circle mt-1" aria-hidden="true"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label" htmlFor="username">
                  Username
                </label>
                <div className="input-icon">
                  <i className="fas fa-user" aria-hidden="true"></i>
                  <input
                    id="username"
                    type="text"
                    className={`form-control${errors.username ? ' is-invalid' : ''}`}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    placeholder="Your username"
                    {...register('username')}
                  />
                </div>
                <FieldError message={errors.username?.message} />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className="input-icon">
                  <i className="fas fa-key" aria-hidden="true"></i>
                  <PasswordInput
                    id="password"
                    className={`form-control${errors.password ? ' is-invalid' : ''}`}
                    autoComplete="current-password"
                    placeholder="Your password"
                    {...register('password')}
                  />
                </div>
                <FieldError message={errors.password?.message} />
              </div>

              <div className="form-check mb-4">
                <input id="remember" type="checkbox" className="form-check-input" {...register('remember')} />
                <label className="form-check-label" htmlFor="remember">
                  Remember me for 30 days
                </label>
              </div>

              <button type="submit" className="btn btn-admin admin-login-submit w-100" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Signing in…
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2" aria-hidden="true"></i>Login
                  </>
                )}
              </button>
            </form>

            <p className="admin-login-help">Forgot your password? Ask a super admin to set a new one in Admin Accounts.</p>

            <a href="/" className="admin-login-back">
              <i className="fas fa-arrow-left" aria-hidden="true"></i> Back to website
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
