import { Router } from "express";
import type { NextFunction, Response } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { UsersError, usersService } from "./users.service.js";
import { PERMISSIONS } from "../auth/permissions.js";

const router = Router();
const idSchema = z.string().uuid();
const roleSchema = z.nativeEnum(UserRole);
const createSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(100),
  role: roleSchema,
  permissions: z.array(z.string().refine((permission) => PERMISSIONS.includes(permission as (typeof PERMISSIONS)[number]), "Permiso no válido.")).optional(),
});
const updateSchema = z
  .object({
    fullName: z.string().trim().min(3).max(120).optional(),
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
    permissions: z.array(z.string().refine((permission) => PERMISSIONS.includes(permission as (typeof PERMISSIONS)[number]), "Permiso no válido.")).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Indica al menos un cambio.");

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
    response.json(await usersService.roles());
  } catch (error) {
    sendError(error, response, next);
  }
});
router.get("/permissions", async (request, response, next) => {
  try {
    response.json(usersService.permissions());
  } catch (error) {
    sendError(error, response, next);
  }
});
router.put("/roles/:role/permissions", async (request, response, next) => {
  try {
    const role = roleSchema.parse(request.params.role);
    const body = z.object({ permissions: z.array(z.string().refine((permission) => PERMISSIONS.includes(permission as (typeof PERMISSIONS)[number]), "Permiso no válido.")) }).parse(request.body);
    response.json(await usersService.updateRolePermissions(role, body.permissions));
  } catch (error) { sendError(error, response, next); }
});
router.get("/access-roles", async (request, response, next) => {
  try { response.json(await usersService.listAccessRoles((request as AuthenticatedRequest).auth!.companyId)); }
  catch (error) { sendError(error, response, next); }
});
router.post("/access-roles", async (request, response, next) => {
  try {
    const body = z.object({ name: z.string().trim().min(3).max(80), description: z.string().trim().max(220).optional(), permissions: z.array(z.string().refine((permission) => PERMISSIONS.includes(permission as (typeof PERMISSIONS)[number]), "Permiso no válido.")) }).parse(request.body);
    response.status(201).json(await usersService.createAccessRole((request as AuthenticatedRequest).auth!.companyId, body));
  } catch (error) { sendError(error, response, next); }
});
router.get("/", async (request, response, next) => {
  try {
    const auth = request as AuthenticatedRequest;
    response.json(await usersService.list(auth.auth!.companyId));
  } catch (error) {
    sendError(error, response, next);
  }
});
router.post("/", async (request, response, next) => {
  try {
    const auth = request as AuthenticatedRequest;
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
