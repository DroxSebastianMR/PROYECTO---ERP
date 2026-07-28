import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(async () => {
    const storedSession = authStorageService.get();
    const activeAccessToken = getAccessToken();
    authStorageService.clear();
    setUser(null);
    setAccessToken(null);

    if (!storedSession || !activeAccessToken) return;
    try {
      await authService.logout(storedSession.session.refreshToken, activeAccessToken);
    } catch {
      // Local logout must always succeed, even if the server is unreachable.
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    authStorageService.save(
      { user: response.user, refreshToken: response.tokens.refreshToken },
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

      try {
        const response = await authService.refreshToken(storedSession.session.refreshToken);
        authStorageService.save(
          { user: response.user, refreshToken: response.tokens.refreshToken },
          storedSession.storage,
        );
        setAccessToken(response.tokens.accessToken);
        setUser(response.user);
      } catch {
        authStorageService.clear();
        setAccessToken(null);
      } finally {
        setIsInitializing(false);
      }
    };

    void restoreSession();
  }, []);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
