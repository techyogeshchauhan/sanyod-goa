import type { ADMIN_ROLES } from '../constants';

export type AdminRole = (typeof ADMIN_ROLES)[number];

/** User identity stored in the user session and returned by /api/auth/me. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/** Admin identity stored in the admin session and returned by /api/admin/auth/me. */
export interface SessionAdmin {
  id: string;
  username: string;
  name?: string;
  role: AdminRole;
}

export interface MeResponse {
  user: SessionUser | null;
}

export interface AdminMeResponse {
  admin: SessionAdmin | null;
}

export interface ResetTokenValidation {
  valid: boolean;
  email?: string;
}
