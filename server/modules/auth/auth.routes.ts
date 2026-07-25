import { Router } from "express";
import { z } from "zod";
import { AuthError, authService } from "./auth.service.js";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});
const logoutSchema = z.object({ refreshToken: z.string().min(1) });
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
authRouter.post("/logout", async (request, response, next) => {
  try {
    const { refreshToken } = logoutSchema.parse(request.body);
    await authService.logout(refreshToken);
    response.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError)
      return response.status(400).json({ message: "Sesión inválida." });
    next(error);
  }
});
