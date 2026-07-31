import type {
  AuthApiResponse,
  LoginResponse,
  RefreshResponse,
} from "@/features/auth/types/auth.types";

/** Keeps the API contract isolated from the UI's authentication state. */
export const mapAuthResponse = (response: AuthApiResponse): LoginResponse => ({
  user: response.user,
  tokens: response.tokens,
});

export const mapRefreshResponse = (response: AuthApiResponse): RefreshResponse => ({
  user: response.user,
  tokens: response.tokens,
});
