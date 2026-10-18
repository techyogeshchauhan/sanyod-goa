import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

export interface FromState {
  from?: { pathname: string; search?: string; hash?: string };
}

function PageLoading() {
  return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

/** Logged-in users only; others go to /login and come back afterwards (like PHP redirect_url). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location } satisfies FromState} />;
  return <>{children}</>;
}

/** Login/register pages: logged-in users are sent on to where they were going. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoading />;
  if (user) {
    const from = (location.state as FromState | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/'} replace />;
  }
  return <>{children}</>;
}

export function redirectTarget(state: unknown): string {
  const from = (state as FromState | null)?.from;
  return from ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/';
}
