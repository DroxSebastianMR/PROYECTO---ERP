import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { tokenService, type AccessTokenPayload } from "./token.service.js";

export type AuthenticatedRequest = Request & { auth?: AccessTokenPayload };

export const requireAuthentication = (request: Request, response: Response, next: NextFunction) => {
  const authorization = request.header("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Se requiere una sesión válida." });
  }

  try {
    (request as AuthenticatedRequest).auth = tokenService.verifyAccessToken(token);
    next();
  } catch (error) {
    const message = error instanceof jwt.TokenExpiredError ? "La sesión ha expirado." : "Token inválido.";
    return response.status(401).json({ message });
  }
};
