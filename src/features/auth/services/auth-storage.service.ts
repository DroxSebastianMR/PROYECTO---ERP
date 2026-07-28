import { AuthStorage, type StoredAuthSession } from "@/features/auth/types/auth.types";

export const AUTH_SESSION_STORAGE_KEY = "districorp.auth.session";

const browserStorage = (storage: AuthStorage) =>
  storage === AuthStorage.PERSISTENT ? window.localStorage : window.sessionStorage;

export const authStorageService = {
  save(session: StoredAuthSession, _storage: AuthStorage = AuthStorage.PERSISTENT) {
    // The refresh session must be shared by tabs until the user explicitly logs out.
    // Access tokens remain memory-only in axios and are restored per tab using refresh.
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    // Do not remove the localStorage key before updating it: other tabs use removal
    // as the explicit cross-tab logout signal.
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  },

  get(): { session: StoredAuthSession; storage: AuthStorage } | null {
    for (const storage of [AuthStorage.PERSISTENT, AuthStorage.SESSION]) {
      const value = browserStorage(storage).getItem(AUTH_SESSION_STORAGE_KEY);
      if (!value) continue;

      try {
        const session = JSON.parse(value) as StoredAuthSession;
        if (storage === AuthStorage.SESSION) {
          // Migrate sessions created by older versions so a newly opened tab stays signed in.
          window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, value);
          window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
          return { session, storage: AuthStorage.PERSISTENT };
        }
        return { session, storage };
      } catch {
        browserStorage(storage).removeItem(AUTH_SESSION_STORAGE_KEY);
      }
    }
    return null;
  },

  clear() {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  },
};
