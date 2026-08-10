import { Router } from "express";
import { z } from "zod";
import { AuthError, authService } from "./auth.service.js";
import { requireAuthentication, type AuthenticatedRequest } from "./auth.middleware.js";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});
const logoutSchema = z.object({ refreshToken: z.string().min(1) });
const passwordRecoverySchema = z.object({
  identifier: z.string().trim().min(3).max(160),
});
const passwordResetSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: z.string().min(8).max(128),
});
export const authRouter = Router();
authRouter.post("/login", async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    response.json(
      await authService.login({
        ...input,
        ipAddress: request.ip,
        userAgent: request.get("user-agent"),
      }),
    );
  } catch (error) {
    if (error instanceof z.ZodError)
      return response.status(400).json({ message: "Datos de acceso inválidos." });
    if (error instanceof AuthError)
      return response.status(error.status).json({ message: error.message });
    next(error);
  }
});
authRouter.post("/logout", requireAuthentication, async (request, response, next) => {
  try {
    const { refreshToken } = logoutSchema.parse(request.body);
    await authService.logout(refreshToken, (request as AuthenticatedRequest).auth!.sub);
    response.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError)
      return response.status(400).json({ message: "Sesión inválida." });
    next(error);
  }
});
authRouter.post("/refresh", async (request, response, next) => {
  try {
    const { refreshToken } = logoutSchema.parse(request.body);
    response.json(await authService.refresh(refreshToken, request.ip, request.get("user-agent")));
  } catch (error) {
    if (error instanceof z.ZodError)
      return response.status(400).json({ message: "Sesión inválida." });
    if (error instanceof AuthError)
      return response.status(error.status).json({ message: error.message });
    next(error);
  }
});
authRouter.post("/password-recovery", async (request, response, next) => {
  try {
    await authService.requestPasswordRecovery(passwordRecoverySchema.parse(request.body));
    response.status(202).json({
      message: "Si los datos coinciden con una cuenta, enviaremos instrucciones a su correo personal.",
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return response.status(400).json({ message: "Ingresa un correo o DNI válido." });
    next(error);
  }
});
authRouter.post("/password-reset", async (request, response, next) => {
  try {
    await authService.resetPassword(passwordResetSchema.parse(request.body));
    response.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError)
      return response.status(400).json({ message: "Datos de recuperación inválidos." });
    if (error instanceof AuthError) return response.status(error.status).json({ message: error.message });
    next(error);
  }
});
