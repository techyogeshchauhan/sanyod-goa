import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PASSWORD_MIN_LENGTH } from '@shared/constants';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import '@/styles/pages/reset-password.page.css';

function ResetFailedAlert({ message }: { message: string }) {
  return (
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <h5>
        <i className="fas fa-exclamation-triangle me-2"></i>Reset Failed
      </h5>
      {message}
      <hr />
      <div className="mt-2">
        <Link to="/forgot-password" className="btn btn-outline-danger btn-sm">
          <i className="fas fa-sync-alt me-1"></i>Get New Reset Link
        </Link>
      </div>
    </div>
  );
}

function InvalidLink() {
  return (
    <div className="text-center py-5">
      <i className="fas fa-exclamation-circle fa-4x text-warning mb-4"></i>
      <h3 className="fw-bold">Invalid Reset Link</h3>
      <p className="text-muted mb-4">This reset link is invalid or has expired.</p>
      <div className="d-grid gap-2 col-md-6 mx-auto">
        <Link to="/forgot-password" className="btn btn-danger">
          <i className="fas fa-redo me-2"></i>Request New Reset Link
        </Link>
        <Link to="/login" className="btn btn-outline-danger">
          <i className="fas fa-sign-in-alt me-2"></i>Back to Login
        </Link>
      </div>
    </div>
  );
}

function Requirement({ met, label, metLabel }: { met: boolean; label: string; metLabel?: string }) {
  return (
    <li className={met ? 'met' : ''}>
      {met ? <i className="fas fa-check-circle text-success"></i> : <i className="fas fa-circle fa-xs"></i>} {met ? (metLabel ?? label) : label}
    </li>
  );
}

/** Set new password (reset_password.php). */
export default function ResetPasswordPage() {
  useBodyClass('page-reset-password');
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = useQuery({
    queryKey: ['reset-token', token],
    queryFn: () => authApi.validateResetToken(token),
    enabled: token.length >= 20,
    retry: false,
  });

  const lengthOk = password.length >= PASSWORD_MIN_LENGTH;
  const matches = password.length > 0 && confirm.length > 0 && password === confirm;
  const canSubmit = lengthOk && password === confirm && !submitting;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await authApi.resetPassword({ token, password, confirmPassword: confirm });
      setUser(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? `❌ ${err.message}` : '❌ Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const missingParams = token.length < 20;
  const invalid = missingParams || (validation.isSuccess && !validation.data.valid) || validation.isError;

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="reset-card card shadow-lg">
            <div className="card-header">
              <i className="fas fa-redo-alt me-2"></i>Set New Password
            </div>
            <div className="card-body p-4">
              {validation.isLoading && !missingParams ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : invalid ? (
                <>
                  <ResetFailedAlert
                    message={missingParams ? '❌ Invalid reset link parameters.' : '❌ This reset link is invalid or has expired.'}
                  />
                  <InvalidLink />
                </>
              ) : (
                <>
                  {error && <ResetFailedAlert message={error} />}

                  <div className="text-center mb-4">
                    <div className="mb-3">
                      <i className="fas fa-user-shield fa-4x text-danger"></i>
                    </div>
                    <h3 className="fw-bold">Create New Password</h3>
                    <p className="text-muted">
                      For: <span className="fw-bold text-primary">{validation.data?.email}</span>
                    </p>
                  </div>

                  <form method="POST" autoComplete="off" id="resetForm" onSubmit={onSubmit}>
                    <div className="mb-4">
                      <label htmlFor="password" className="form-label fw-bold">
                        New Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="fas fa-lock text-danger"></i>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          id="password"
                          className="form-control"
                          placeholder="Enter new password"
                          required
                          minLength={PASSWORD_MIN_LENGTH}
                          autoFocus
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="btn btn-outline-secondary" type="button" id="togglePassword" onClick={() => setShowPassword((v) => !v)} aria-label="Show or hide password">
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <PasswordStrengthMeter password={password} />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="confirm_password" className="form-label fw-bold">
                        Confirm Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="fas fa-lock text-danger"></i>
                        </span>
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          name="confirm_password"
                          id="confirm_password"
                          className="form-control"
                          placeholder="Confirm new password"
                          required
                          minLength={PASSWORD_MIN_LENGTH}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                        />
                        <button className="btn btn-outline-secondary" type="button" id="toggleConfirmPassword" onClick={() => setShowConfirm((v) => !v)} aria-label="Show or hide password">
                          <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div id="passwordMatch" className="mt-2">
                        {password && confirm ? (
                          matches ? (
                            <span className="text-success">
                              <i className="fas fa-check me-1"></i>Passwords match
                            </span>
                          ) : (
                            <span className="text-danger">
                              <i className="fas fa-times me-1"></i>Passwords do not match
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>

                    <div className="alert alert-info">
                      <h6>
                        <i className="fas fa-info-circle me-2"></i>Password Requirements
                      </h6>
                      <ul className="requirement-list mb-0">
                        <Requirement met={lengthOk} label={`Minimum ${PASSWORD_MIN_LENGTH} characters`} />
                        <Requirement met={matches} label="Passwords must match" metLabel="Passwords match" />
                      </ul>
                    </div>

                    <div className="d-grid gap-3 mt-4">
                      <button type="submit" className="btn btn-danger btn-lg" id="resetBtn" disabled={!canSubmit}>
                        <i className="fas fa-key me-2"></i>Set New Password &amp; Login
                      </button>
                      <Link to="/forgot-password" className="btn btn-outline-secondary">
                        <i className="fas fa-sync-alt me-2"></i>Get New Reset Link
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
