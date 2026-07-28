import { axiosInstance, ApiError, setAccessToken } from "@/infrastructure/api/client/axios.instance";

export { ApiError, setAccessToken };

export const httpClient = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const { data } = await axiosInstance.request<T>({
    url: path,
    method: options?.method,
    headers: options?.headers ? Object.fromEntries(new Headers(options.headers).entries()) : undefined,
    data: options?.body ? JSON.parse(options.body.toString()) : undefined,
  });
  return data as T;
};
