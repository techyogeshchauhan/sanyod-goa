import { ApiError } from '@/api/client';

/** Centered spinner used while a page's data loads. */
export function PageLoading() {
  return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

/** Error box for a failed page query. */
export function PageError({ error, fallback = 'Unable to load this page. Please refresh and try again.' }: { error: unknown; fallback?: string }) {
  const message = error instanceof ApiError ? error.message : fallback;
  return (
    <div className="container py-5">
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-circle me-2"></i>
        {message}
      </div>
    </div>
  );
}
