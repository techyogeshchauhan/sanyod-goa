import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { AdminLoginInput } from '@shared/schemas/auth';
import type { SessionAdmin } from '@shared/types/auth';
import { adminApi, setSessionExpiredHandler } from './api';

const ADMIN_ME = ['admin', 'me'] as const;

interface AdminAuthValue {
  admin: SessionAdmin | null;
  isLoading: boolean;
  login: (input: AdminLoginInput) => Promise<SessionAdmin>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ADMIN_ME, queryFn: adminApi.me, staleTime: 5 * 60 * 1000 });

  const login = useCallback(
    async (input: AdminLoginInput) => {
      const { admin } = await adminApi.login(input);
      qc.setQueryData(ADMIN_ME, { admin });
      return admin;
    },
    [qc],
  );
  const clear = useCallback(() => {
    qc.removeQueries({ predicate: (q) => q.queryKey[0] === 'admin' && q.queryKey[1] !== 'me' });
    qc.setQueryData(ADMIN_ME, { admin: null });
  }, [qc]);

  const logout = useCallback(async () => {
    await adminApi.logout().catch(() => undefined);
    clear();
  }, [clear]);

  // Session expired, revoked (password/role change) or account deactivated: back to the login page,
  // which returns to the current page afterwards (RequireAdmin keeps `from`).
  useEffect(() => {
    setSessionExpiredHandler(clear);
    return () => setSessionExpiredHandler(null);
  }, [clear]);

  const value = useMemo(() => ({ admin: data?.admin ?? null, isLoading, login, logout }), [data, isLoading, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}

/** Admin pages: no session → /admin/login (and back afterwards). */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
