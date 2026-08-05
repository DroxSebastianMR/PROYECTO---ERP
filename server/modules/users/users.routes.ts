import { Router } from "express";
import type { NextFunction, Response } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { MANAGEABLE_ROLES, UsersError, usersService } from "./users.service.js";
import { PERMISSIONS } from "../auth/permissions.js";

const router = Router();
const idSchema = z.string().uuid();
const roleSchema = z.enum(MANAGEABLE_ROLES);
const createSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(100),
  role: roleSchema,
  permissions: z.array(z.enum(PERMISSIONS)).min(1).optional(),
});
const updateSchema = z
  .object({
    fullName: z.string().trim().min(3).max(120).optional(),
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
    permissions: z.array(z.enum(PERMISSIONS)).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Indica al menos un cambio.");

const requireAdmin = (request: AuthenticatedRequest, response: Response) => {
  if (request.auth?.role !== UserRole.ADMIN) {
    response.status(403).json({ message: "Solo un administrador puede gestionar usuarios." });
    return false;
  }
  return true;
};
const sendError = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof z.ZodError)
    return response
      .status(400)
      .json({ message: "Datos de usuario inválidos.", details: error.flatten() });
  if (error instanceof UsersError)
    return response.status(error.status).json({ message: error.message });
  if ((error as { code?: string }).code === "P2002")
    return response.status(409).json({ message: "Ya existe un usuario con este correo." });
  next(error);
};

router.get("/roles", async (request, response, next) => {
  try {
    if (!requireAdmin(request as AuthenticatedRequest, response)) return;
    response.json(usersService.roles());
  } catch (error) {
    sendError(error, response, next);
  }
});
router.get("/permissions", async (request, response, next) => {
  try {
    if (!requireAdmin(request as AuthenticatedRequest, response)) return;
    response.json(usersService.permissions());
  } catch (error) {
    sendError(error, response, next);
  }
});
router.get("/", async (request, response, next) => {
  try {
    const auth = request as AuthenticatedRequest;
    if (!requireAdmin(auth, response)) return;
    response.json(await usersService.list(auth.auth!.companyId));
  } catch (error) {
    sendError(error, response, next);
  }
});
router.post("/", async (request, response, next) => {
  try {
    const auth = request as AuthenticatedRequest;
    if (!requireAdmin(auth, response)) return;
    response
      .status(201)
      .json(await usersService.create(auth.auth!.companyId, createSchema.parse(request.body)));
  } catch (error) {
    sendError(error, response, next);
  }
});
router.patch("/:id", async (request, response, next) => {
  try {
    const auth = request as AuthenticatedRequest;
    if (!requireAdmin(auth, response)) return;
    response.json(
      await usersService.update(
        auth.auth!.companyId,
        auth.auth!.id,
        idSchema.parse(request.params.id),
        updateSchema.parse(request.body),
      ),
    );
  } catch (error) {
    sendError(error, response, next);
  }
});

export const usersRouter = router;
