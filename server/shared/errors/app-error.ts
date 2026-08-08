import { ApiErrorCode } from "./api-error-code.js";
import { HttpStatusCode } from "./http-status-code.js";
import type { ApiValidationDetails } from "./api-error.types.js";

/**
 * Base error for expected application failures.
 * Its code is stable; the human-readable message may evolve without breaking clients.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: HttpStatusCode = HttpStatusCode.BAD_REQUEST,
    public readonly code: ApiErrorCode = ApiErrorCode.BUSINESS_RULE_VIOLATION,
    public readonly details?: ApiValidationDetails,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Los datos enviados no son válidos.", details?: ApiValidationDetails) {
    super(message, HttpStatusCode.BAD_REQUEST, ApiErrorCode.VALIDATION_FAILED, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Se requiere una sesión válida.") {
    super(message, HttpStatusCode.UNAUTHORIZED, ApiErrorCode.AUTHENTICATION_REQUIRED);
    this.name = "AuthenticationError";
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = "Tu sesión expiró. Inicia sesión nuevamente.") {
    super(message, HttpStatusCode.SESSION_EXPIRED, ApiErrorCode.SESSION_EXPIRED);
    this.name = "SessionExpiredError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message, HttpStatusCode.FORBIDDEN, ApiErrorCode.ACCESS_DENIED);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "El recurso solicitado no existe.") {
    super(message, HttpStatusCode.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Ya existe un registro con esos datos.") {
    super(message, HttpStatusCode.CONFLICT, ApiErrorCode.DUPLICATE_RESOURCE);
    this.name = "ConflictError";
  }
}
