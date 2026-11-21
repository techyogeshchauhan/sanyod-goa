import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PASSWORD_MIN_LENGTH } from '@shared/constants';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';

function Requirement({ met, label, metLabel }: { met: boolean; label: string; metLabel?: string }) {
  return (
    <li className={met ? 'met' : ''}>
      <i className={`fas ${met ? 'fa-check-circle' : 'fa-circle'} me-2`} style={met ? undefined : { fontSize: '0.5rem', verticalAlign: 'middle' }}></i>
      {met ? (metLabel ?? label) : label}
    </li>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="input-group">
        <input
          type={show ? 'text' : 'password'}
          name={id}
          id={id}
          className="form-control"
          style={{ borderRight: 0 }}
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button className="btn btn-light" style={{ borderRadius: '0 12px 12px 0' }} type="button" onClick={() => setShow((v) => !v)} aria-label="Show or hide password">
          <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`}></i>
        </button>
      </div>
    </>
  );
}

/** Set a new password (reset_password.php). */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const missingParams = token.length < 20;
  const invalid = missingParams || (validation.isSuccess && !validation.data.valid) || validation.isError;

  return (
    <AuthShell cardClass="reset-card" icon="fas fa-user-shield" title="Set a new password">
      {validation.isLoading && !missingParams ? (
        <Spinner />
      ) : invalid ? (
        <div>
          <div className="alert alert-danger">{missingParams ? 'Invalid reset link parameters.' : 'This reset link is invalid or has expired.'}</div>
          <h3 className="h4">Invalid Reset Link</h3>
          <p className="text-muted">This reset link is invalid or has expired. Request a new one; it is valid for 1 hour.</p>
          <div className="d-grid gap-2">
            <Link to="/forgot-password" className="btn btn-primary">
              <i className="fas fa-redo"></i> Request a new reset link
            </Link>
            <Link to="/login" className="btn btn-light">
              Back to login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted mb-4">
            For <strong className="text-ink">{validation.data?.email}</strong>
          </p>
          {error && (
            <div className="alert alert-danger">
              {error}{' '}
              <Link to="/forgot-password" className="fw-600">
                Get a new link
              </Link>
            </div>
          )}
          <form autoComplete="off" id="resetForm" onSubmit={onSubmit} noValidate>
            <div className="mb-3">
              <PasswordField id="password" label="New password" value={password} onChange={setPassword} autoFocus />
              <PasswordStrengthMeter password={password} />
            </div>
            <div className="mb-3">
              <PasswordField id="confirm_password" label="Confirm new password" value={confirm} onChange={setConfirm} />
            </div>
            <ul className="requirement-list mb-4">
              <Requirement met={lengthOk} label={`Minimum ${PASSWORD_MIN_LENGTH} characters`} />
              <Requirement met={matches} label="Passwords must match" metLabel="Passwords match" />
            </ul>
            <button type="submit" className="btn btn-primary btn-lg w-100" id="resetBtn" disabled={!canSubmit}>
              <i className="fas fa-key"></i> Set new password &amp; log in
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
