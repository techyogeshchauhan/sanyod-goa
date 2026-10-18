import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@shared/constants';
import type { ApiErrorBody } from '@shared/types/api';

const SAFE_METHODS = new Set(['get', 'head', 'options']);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

let csrfRequest: Promise<string> | null = null;

/** The API issues the token in a readable cookie (double-submit); fetch it once if missing. */
async function csrfToken(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;
  csrfRequest ??= api
    .get<{ data: { csrfToken: string } }>('/auth/csrf')
    .then((r) => r.data.data.csrfToken)
    .finally(() => {
      csrfRequest = null;
    });
  return csrfRequest;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!SAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
    config.headers.set(CSRF_HEADER_NAME, await csrfToken());
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody>) => {
    const body = err.response?.data?.error;
    if (err.response && body) {
      return Promise.reject(new ApiError(err.response.status, body.code, body.message, body.fields));
    }
    return Promise.reject(
      new ApiError(err.response?.status ?? 0, 'NETWORK_ERROR', 'Unable to reach the server. Please check your connection and try again.'),
    );
  },
);

/** Unwraps `{ data }` responses. */
export async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  return (await promise).data.data;
}
