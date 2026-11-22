import { forwardRef, useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Classes for the wrapper (e.g. spacing), so the eye button stays centred on the input. */
  wrapperClassName?: string;
};

/**
 * Password input with a show / hide (eye) button inside it. Works with react-hook-form's
 * `register()` (the ref is forwarded) and with controlled inputs.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className = 'form-control', wrapperClassName = '', ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  return (
    <div className={`password-field ${wrapperClassName}`.trim()}>
      <input {...props} ref={ref} type={show ? 'text' : 'password'} className={className} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        title={show ? 'Hide password' : 'Show password'}
      >
        <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
      </button>
    </div>
  );
});
