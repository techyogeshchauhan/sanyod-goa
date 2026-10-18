import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@shared/schemas/auth';
import { authApi } from '@/api/auth';
import { FieldError } from '@/components/common/FieldError';
import { useBodyClass } from '@/hooks/useBodyClass';
import { applyApiError } from '@/utils/forms';
import '@/styles/pages/forgot-password.page.css';

/**
 * Forgot password (forget.php). Same card and steps as live; the reset link is now emailed
 * instead of being shown on screen (allowed adjustment A7, decision D-13).
 */
export default function ForgotPasswordPage() {
  useBodyClass('page-forgot-password');
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
      setError(`❌ ${applyApiError(err, setFieldError)}`);
    }
  });

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="forget-card card shadow-lg">
            <div className="card-header">
              <i className="fas fa-key me-2"></i>Direct Password Reset
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setError(null)}></button>
                </div>
              )}

              {sentTo ? (
                <div className="alert alert-success">
                  <h5>
                    <i className="fas fa-envelope-open-text me-2"></i>Check Your Email
                  </h5>
                  <p className="mb-2">
                    If <strong>{sentTo}</strong> is registered with us, we have sent a password reset link to it.
                  </p>
                  <p className="mb-0">The link is valid for 1 hour. Please also check your spam folder.</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="mb-3">
                      <i className="fas fa-unlock-alt fa-4x text-success"></i>
                    </div>
                    <h3 className="fw-bold">Forgot Your Password?</h3>
                    <p className="text-muted">Enter your email to get a reset link</p>
                  </div>

                  <form method="POST" autoComplete="off" onSubmit={onSubmit}>
                    <div className="mb-4">
                      <label htmlFor="email" className="form-label fw-bold">
                        Your Email Address
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="fas fa-envelope text-success"></i>
                        </span>
                        <input
                          type="email"
                          id="email"
                          className="form-control"
                          placeholder="name@example.com"
                          required
                          {...register('email')}
                        />
                      </div>
                      <FieldError message={errors.email?.message} />
                    </div>

                    <div className="quick-action">
                      <h6>
                        <i className="fas fa-bolt me-2"></i>Quick Reset Process
                      </h6>
                      <div className="step">
                        <div className="step-number">1</div>
                        <div>Enter your registered email</div>
                      </div>
                      <div className="step">
                        <div className="step-number">2</div>
                        <div>Get the reset link in your inbox</div>
                      </div>
                      <div className="step">
                        <div className="step-number">3</div>
                        <div>Click link and set new password</div>
                      </div>
                    </div>

                    <div className="d-grid gap-3 mt-4">
                      <button type="submit" className="btn btn-success btn-lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>Generate Reset Link
                          </>
                        )}
                      </button>
                      <Link to="/login" className="btn btn-outline-secondary">
                        <i className="fas fa-arrow-left me-2"></i>Back to Login
                      </Link>
                    </div>
                  </form>
                </>
              )}

              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-2">Remember your password?</p>
                <Link to="/login" className="btn btn-link text-success fw-bold">
                  <i className="fas fa-sign-in-alt me-1"></i>Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
