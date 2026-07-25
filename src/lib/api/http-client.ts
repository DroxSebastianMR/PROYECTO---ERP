import { env } from "@/app/config/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export const httpClient = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${env.API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) throw new ApiError("No se pudo completar la solicitud.", response.status);
  return response.json() as Promise<T>;
};
