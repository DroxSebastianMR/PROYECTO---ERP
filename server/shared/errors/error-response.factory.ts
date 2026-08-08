import { ApiErrorCode } from "./api-error-code.js";
import { AppError } from "./app-error.js";
import { HttpStatusCode } from "./http-status-code.js";
import type { ApiErrorResponse, ErrorContext } from "./api-error.types.js";

export const createErrorResponse = (error: AppError, context: ErrorContext): ApiErrorResponse => ({
  status: error.status,
  code: error.code,
  message: error.message,
  ...(error.details ? { details: error.details } : {}),
  timestamp: (context.timestamp ?? new Date()).toISOString(),
  path: context.path,
});

export const createUnexpectedErrorResponse = (context: ErrorContext): ApiErrorResponse => ({
  status: HttpStatusCode.INTERNAL_SERVER_ERROR,
  code: ApiErrorCode.INTERNAL_ERROR,
  message: "Ocurrió un error inesperado en el servidor.",
  timestamp: (context.timestamp ?? new Date()).toISOString(),
  path: context.path,
});
