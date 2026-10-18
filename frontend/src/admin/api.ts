import type { AdminLoginInput } from '@shared/schemas/auth';
import type { Paginated } from '@shared/types/api';
import type { AdminMeResponse, SessionAdmin } from '@shared/types/auth';
import { api, unwrap } from '@/api/client';

export type ListParams = Record<string, string | number | undefined>;

/** Admin API (/api/admin/*). It uses its own session cookie; the CSRF token is shared. */
export const adminApi = {
  me: () => unwrap<AdminMeResponse>(api.get('/admin/auth/me')),
  login: (input: AdminLoginInput) => unwrap<{ admin: SessionAdmin }>(api.post('/admin/auth/login', input)),
  logout: () => api.post('/admin/auth/logout'),

  get: <T>(path: string, params?: ListParams) => unwrap<T>(api.get(`/admin${path}`, { params })),
  list: async <T>(path: string, params?: ListParams): Promise<Paginated<T>> => (await api.get<Paginated<T>>(`/admin${path}`, { params })).data,
  post: <T>(path: string, body?: unknown) => unwrap<T>(api.post(`/admin${path}`, body ?? {})),
  patch: <T>(path: string, body: unknown) => unwrap<T>(api.patch(`/admin${path}`, body)),
  put: <T>(path: string, body: unknown) => unwrap<T>(api.put(`/admin${path}`, body)),
  del: (path: string) => api.delete(`/admin${path}`),
  /** Multipart create/update (files + fields). */
  form: <T>(method: 'post' | 'patch' | 'put', path: string, data: FormData) => unwrap<T>(api[method](`/admin${path}`, data)),
  fileUrl: (path: string) => `${import.meta.env.VITE_API_URL ?? '/api'}/admin${path}`,
};

/** Builds FormData from plain values (skips undefined; booleans/numbers become strings). */
export function toFormData(values: Record<string, unknown>, files: Record<string, File | null | undefined> = {}): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null) continue;
    form.append(k, typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  for (const [k, f] of Object.entries(files)) if (f) form.append(k, f);
  return form;
}
