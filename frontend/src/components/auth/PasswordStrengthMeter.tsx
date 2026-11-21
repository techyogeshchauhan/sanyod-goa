/** Same scoring as reset_password.php: +25 each for ≥6 chars, ≥8 chars, an uppercase letter, a digit/symbol. */
export function passwordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 6) strength += 25;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9!@#$%^&*]/.test(password)) strength += 25;
  return strength;
}

export function strengthColor(strength: number): string {
  if (strength < 50) return '#c2453d';
  if (strength < 75) return '#c9a227';
  return '#4f8a5f';
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = passwordStrength(password);
  return (
    <div className="password-meter mt-2">
      <div
        className="password-meter-bar"
        id="passwordStrength"
        style={{ width: `${strength}%`, backgroundColor: strengthColor(strength) }}
      ></div>
    </div>
  );
}
