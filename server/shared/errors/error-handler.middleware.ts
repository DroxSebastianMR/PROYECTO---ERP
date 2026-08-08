import type { ErrorRequestHandler } from "express";
import { AppError } from "./app-error.js";
import { createErrorResponse, createUnexpectedErrorResponse } from "./error-response.factory.js";

/**
 * Prepared global middleware. It is intentionally not registered in app.ts yet,
 * so current endpoints keep their existing response contracts during the migration.
 */
export const globalErrorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof AppError) {
    return response.status(error.status).json(createErrorResponse(error, { path: request.originalUrl }));
  }

  console.error(error);
  return response
    .status(500)
    .json(createUnexpectedErrorResponse({ path: request.originalUrl }));
};
