import type { ApiErrorCode } from "./api-error-code.js";
import type { HttpStatusCode } from "./http-status-code.js";

export type ApiValidationDetails = Record<string, string[] | undefined>;

/** Public error envelope returned to API clients. */
export type ApiErrorResponse = {
  status: HttpStatusCode;
  code: ApiErrorCode;
  message: string;
  details?: ApiValidationDetails;
  timestamp: string;
  path: string;
};

export type ErrorContext = {
  path: string;
  timestamp?: Date;
};
