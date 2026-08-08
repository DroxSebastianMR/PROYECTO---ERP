import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { passwordService } from "../auth/password.service.js";
import { PERMISSIONS } from "../auth/permissions.js";
import { permissionService } from "../auth/permission.service.js";

export const MANAGEABLE_ROLES = Object.values(UserRole) as UserRole[];
export type ManageableRole = UserRole;

const roleDescriptions: Record<UserRole, readonly string[]> = {
  ADMIN: ["Acceso administrativo completo", "Gestiona usuarios, roles y permisos"],
  MANAGER: ["Supervisa todos los módulos", "Consulta indicadores y operaciones"],
  SALES_PURCHASING: ["Registra ventas propias", "Gestiona clientes y opera caja"],
  ACCOUNTANT: ["Consulta compras, ventas y caja", "Exporta reportes operativos"],
  WAREHOUSE: ["Controla stock y movimientos", "Gestiona operaciones de almacén"],
};

export class UsersError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

const safeSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  permissions: true,
  directPermissions: { select: { permission: { select: { code: true } } } },
} as const;

const toSystemUser = async (user: {
  id: string;
  role: UserRole;
  permissions: string[];
  directPermissions: Array<{ permission: { code: string } }>;
}) => ({
  ...user,
  additionalPermissions: permissionService.normalize(user.directPermissions.map(({ permission }) => permission.code)),
  permissions: await permissionService.resolveEffectivePermissions(user),
});

export const usersService = {
  async list(companyId: string) {
    const users = await prisma.user.findMany({
      where: { companyId },
      select: safeSelect,
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    });
    return Promise.all(users.map(toSystemUser));
  },

  async create(
    companyId: string,
    input: { fullName: string; email: string; password: string; role: UserRole; permissions?: string[] },
  ) {
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new UsersError("Ya existe un usuario con este correo.", 409);

    const user = await prisma.user.create({
      data: {
        companyId,
        fullName: input.fullName.trim(),
        email,
        passwordHash: await passwordService.hash(input.password),
        role: input.role,
      },
      select: safeSelect,
    });
    await permissionService.replaceUserAdditionalPermissions(user.id, input.permissions ?? []);
    return toSystemUser({ ...user, directPermissions: (input.permissions ?? []).map((code) => ({ permission: { code } })) });
  },

  async update(
    companyId: string,
    actorId: string,
    id: string,
    input: { fullName?: string; role?: UserRole; isActive?: boolean; permissions?: string[] },
  ) {
    const user = await prisma.user.findFirst({ where: { id, companyId }, select: { id: true, role: true, isActive: true } });
    if (!user) throw new UsersError("Usuario no encontrado.", 404);
    if (id === actorId && (input.isActive === false || (input.role && input.role !== UserRole.ADMIN))) {
      throw new UsersError("No puedes desactivar ni quitar tu propio rol de administrador.", 409);
    }
    const removesAdmin = user.role === UserRole.ADMIN && (input.isActive === false || (input.role && input.role !== UserRole.ADMIN));
    if (removesAdmin) {
      const admins = await prisma.user.count({ where: { companyId, role: UserRole.ADMIN, isActive: true } });
      if (admins <= 1) throw new UsersError("Debe mantenerse al menos un administrador activo.", 409);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: safeSelect,
    });
    if (input.permissions !== undefined) await permissionService.replaceUserAdditionalPermissions(id, input.permissions);
    const directPermissions = input.permissions === undefined
      ? updated.directPermissions
      : input.permissions.map((code) => ({ permission: { code } }));
    return toSystemUser({ ...updated, directPermissions });
  },

  async roles() {
    return Promise.all(MANAGEABLE_ROLES.map(async (role) => ({
      role,
      permissions: await permissionService.listRolePermissions(role),
      description: roleDescriptions[role],
    })));
  },

  permissions() {
    return PERMISSIONS;
  },
};
