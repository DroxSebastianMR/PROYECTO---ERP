import type { AxiosRequestConfig } from "axios";
import { axiosInstance } from "@/infrastructure/api/client/axios.instance";

type HttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";

const request = <TResponse, TBody>(
  method: HttpMethod,
  path: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) =>
  axiosInstance.request<TResponse>({
    ...config,
    method,
    url: path,
    data: body,
  }).then(({ data }) => data);

/** Typed adapter over the centralized Axios instance. */
export const apiClient = {
  post: <TResponse, TBody>(path: string, body?: TBody, config?: AxiosRequestConfig) =>
    request<TResponse, TBody>("POST", path, body, config),
};
