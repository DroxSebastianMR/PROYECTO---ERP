import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";
import {
  AUTH_SESSION_STORAGE_KEY,
  authStorageService,
} from "@/features/auth/services/auth-storage.service";
import { AuthContext, type AuthContextValue } from "@/features/auth/providers/auth-context";
import { getAccessToken, setAccessToken } from "@/infrastructure/api/client/axios.instance";
import {
  AuthStorage,
  type AuthenticatedUser,
  type LoginCredentials,
} from "@/features/auth/types/auth.types";

const hasUsableAccessToken = (token?: string) => {
  if (!token) return false;
  try {
    const encodedPayload = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!encodedPayload) return false;
    const payload = JSON.parse(
      window.atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=")),
    ) as { exp?: number };
    // Leave a small margin so the first protected request does not race with expiry.
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + 30_000;
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSessionPromptOpen, setIsSessionPromptOpen] = useState(false);

  const logout = useCallback(async () => {
    const storedSession = authStorageService.get();
    const activeAccessToken = getAccessToken();
    authStorageService.clear();
    queryClient.clear();
    window.localStorage.removeItem("districorp.query-cache");
    setUser(null);
    setAccessToken(null);

    if (!storedSession || !activeAccessToken) return;
    try {
      await authService.logout(storedSession.session.refreshToken, activeAccessToken);
    } catch {
      // Local logout must always succeed, even if the server is unreachable.
    }
  }, [queryClient]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    authStorageService.save(
      {
        user: response.user,
        refreshToken: response.tokens.refreshToken,
        accessToken: response.tokens.accessToken,
      },
      AuthStorage.PERSISTENT,
    );
    setAccessToken(response.tokens.accessToken);
    setUser(response.user);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedSession = authStorageService.get();
      if (!storedSession) {
        setIsInitializing(false);
        return;
      }

      if (hasUsableAccessToken(storedSession.session.accessToken)) {
        setAccessToken(storedSession.session.accessToken!);
        setUser(storedSession.session.user);
        setIsInitializing(false);
        return;
      }

      try {
        const response = await authService.refreshToken(storedSession.session.refreshToken);
        authStorageService.save(
          {
            user: response.user,
            refreshToken: response.tokens.refreshToken,
            accessToken: response.tokens.accessToken,
          },
          storedSession.storage,
        );
        setAccessToken(response.tokens.accessToken);
        setUser(response.user);
      } catch {
        authStorageService.clear();
        queryClient.clear();
        window.localStorage.removeItem("districorp.query-cache");
        setAccessToken(null);
      } finally {
        setIsInitializing(false);
      }
    };

    void restoreSession();
  }, [queryClient]);

  const keepSessionAlive = useCallback(async () => {
    const storedSession = authStorageService.get();
    if (!storedSession) return;
    try {
      const response = await authService.refreshToken(storedSession.session.refreshToken);
      authStorageService.save(
        {
          user: response.user,
          refreshToken: response.tokens.refreshToken,
          accessToken: response.tokens.accessToken,
        },
        storedSession.storage,
      );
      setAccessToken(response.tokens.accessToken);
      setUser(response.user);
      setIsSessionPromptOpen(false);
    } catch {
      // Do not force logout on a transient network failure; the user can retry.
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => setIsSessionPromptOpen(true), 12 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const synchronizeLogout = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_STORAGE_KEY && event.newValue === null) {
        setAccessToken(null);
        setUser(null);
      }
    };
    window.addEventListener("storage", synchronizeLogout);
    return () => window.removeEventListener("storage", synchronizeLogout);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isInitializing, login, logout }),
    [isInitializing, login, logout, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isSessionPromptOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/25 backdrop-blur-sm">
          <div className="w-[min(92vw,380px)] rounded-2xl border border-blue-100 bg-white p-6 shadow-2xl">
            <p className="text-lg font-bold text-slate-900">¿Sigues ahí?</p>
            <p className="mt-2 text-sm text-slate-600">Mantén tu sesión activa para continuar trabajando sin interrupciones.</p>
            <button type="button" onClick={() => void keepSessionAlive()} className="mt-5 w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800">Sí, sigo aquí</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
