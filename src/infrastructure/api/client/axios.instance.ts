import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/app/config/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
type AccessTokenRefreshHandler = () => Promise<string | null>;
type RetriableRequestConfig = InternalAxiosRequestConfig & { _retryAfterTokenRefresh?: boolean };
let accessTokenRefreshHandler: AccessTokenRefreshHandler | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

/** Registers the session owner without coupling infrastructure to auth features. */
export const configureAccessTokenRefresh = (handler: AccessTokenRefreshHandler | null) => {
  accessTokenRefreshHandler = handler;
};

const refreshAccessTokenOnce = async () => {
  if (!accessTokenRefreshHandler) return null;

  if (!refreshInFlight) {
    refreshInFlight = accessTokenRefreshHandler().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
};

export const axiosInstance = axios.create({
  baseURL: env.API_URL,
  headers: { "Content-Type": "application/json" },
  // Sales can include a transactional stock update over a remote database.
  // Avoid reporting a false failure while the server is still committing it.
  timeout: 45_000,
});

axiosInstance.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status ?? 0;
    const request = error.config as RetriableRequestConfig | undefined;
    const isAuthRequest = request?.url?.includes("/auth/");

    // Access tokens are intentionally short-lived. Renew once in the background
    // and replay the protected request so individual modules never expose a
    // technical "session expired" message to the operator.
    if (
      (status === 401 || status === 440) &&
      request &&
      !request._retryAfterTokenRefresh &&
      !isAuthRequest &&
      accessTokenRefreshHandler
    ) {
      request._retryAfterTokenRefresh = true;
      const refreshedToken = await refreshAccessTokenOnce();

      if (refreshedToken) {
        request.headers.Authorization = `Bearer ${refreshedToken}`;
        return axiosInstance.request(request);
      }
    }

    const message = error.response?.data?.message ?? "No se pudo completar la solicitud.";
    return Promise.reject(new ApiError(message, status));
  },
);
