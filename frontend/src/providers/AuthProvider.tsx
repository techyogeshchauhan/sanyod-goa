import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { LoginInput, RegisterInput } from '@shared/schemas/auth';
import type { SessionUser } from '@shared/types/auth';
import { authApi } from '@/api/auth';

export const ME_QUERY_KEY = ['me'] as const;

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const setUser = useCallback(
    (user: SessionUser | null) => queryClient.setQueryData(ME_QUERY_KEY, { user }),
    [queryClient],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const { user } = await authApi.login(input);
      setUser(user);
      return user;
    },
    [setUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { user } = await authApi.register(input);
      setUser(user);
      return user;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== ME_QUERY_KEY[0] });
  }, [queryClient, setUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: data?.user ?? null, isLoading, login, register, logout, setUser }),
    [data, isLoading, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
