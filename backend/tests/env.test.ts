import { describe, expect, it } from 'vitest';
import { withAliases } from '../src/config/env';

// .env files written for other hosts use SMTP_USERNAME / SMTP_PASSWORD / SMTP_FROM.
describe('SMTP variable aliases', () => {
  it('fills the canonical names from the aliases', () => {
    const out = withAliases({ SMTP_USERNAME: 'u@example.com', SMTP_PASSWORD: 'secret', SMTP_FROM: 'Site <u@example.com>' });
    expect(out).toMatchObject({ SMTP_USER: 'u@example.com', SMTP_PASS: 'secret', MAIL_FROM: 'Site <u@example.com>' });
  });

  it('keeps a canonical value when both are set, and treats empty as unset', () => {
    const out = withAliases({ SMTP_USER: 'main@example.com', SMTP_USERNAME: 'alias@example.com', SMTP_PASS: '', SMTP_PASSWORD: 'fallback' });
    expect(out.SMTP_USER).toBe('main@example.com');
    expect(out.SMTP_PASS).toBe('fallback');
  });

  it('does not change the real environment object', () => {
    const source = { SMTP_USERNAME: 'u@example.com' };
    withAliases(source);
    expect(source).toEqual({ SMTP_USERNAME: 'u@example.com' });
  });
});
