import { apiClient } from "@/infrastructure/api/client/api-client";
import { API_ENDPOINTS } from "@/infrastructure/api/endpoints";
import { mapAuthResponse, mapRefreshResponse } from "@/features/auth/services/auth.mapper";
import type {
  AuthApiResponse,
  LoginCredentials,
  LoginResponse,
  PasswordRecoveryInput,
  PasswordResetInput,
  RefreshResponse,
} from "@/features/auth/types/auth.types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const data = await apiClient.post<AuthApiResponse, LoginCredentials>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    return mapAuthResponse(data);
  },

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const data = await apiClient.post<AuthApiResponse, { refreshToken: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken },
    );
    return mapRefreshResponse(data);
  },

  async logout(refreshToken: string, accessToken: string): Promise<void> {
    await apiClient.post<void, { refreshToken: string }>(
      API_ENDPOINTS.AUTH.LOGOUT,
      { refreshToken },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  },

  async requestPasswordRecovery(input: PasswordRecoveryInput): Promise<void> {
    await apiClient.post<void, PasswordRecoveryInput>(API_ENDPOINTS.AUTH.PASSWORD_RECOVERY, input);
  },

  async resetPassword(input: PasswordResetInput): Promise<void> {
    await apiClient.post<void, PasswordResetInput>(API_ENDPOINTS.AUTH.PASSWORD_RESET, input);
  },
};
