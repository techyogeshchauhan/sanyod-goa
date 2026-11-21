import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@shared/schemas/auth';
import type { MeResponse, ResetTokenValidation, SessionUser } from '@shared/types/auth';
import { api, unwrap } from './client';

export const authApi = {
  me: () => unwrap<MeResponse>(api.get('/auth/me')),
  register: (input: RegisterInput) => unwrap<{ message: string }>(api.post('/auth/register', input)),
  login: (input: LoginInput) => unwrap<{ user: SessionUser }>(api.post('/auth/login', input)),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (input: ForgotPasswordInput) =>
    unwrap<{ message: string }>(api.post('/auth/forgot-password', input)),
  validateResetToken: (token: string) =>
    unwrap<ResetTokenValidation>(api.post('/auth/reset-password/validate', { token })),
  resetPassword: (input: ResetPasswordInput) => unwrap<{ user: SessionUser }>(api.post('/auth/reset-password', input)),
};
