import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { passwordService } from "../auth/password.service.js";
import { PERMISSIONS, ROLE_PERMISSION_DEFAULTS, type Permission } from "../auth/permissions.js";
import { permissionsForUser } from "../auth/permissions.js";

export const MANAGEABLE_ROLES = [
  UserRole.ADMIN,
  UserRole.SALES_PURCHASING,
  UserRole.ACCOUNTANT,
] as const;

export type ManageableRole = (typeof MANAGEABLE_ROLES)[number];

export const ROLE_PERMISSIONS: Record<ManageableRole, readonly string[]> = {
  ADMIN: [
    "Acceso completo a todos los módulos",
    "Gestionar usuarios y roles",
    "Configurar empresa y seguridad",
  ],
  SALES_PURCHASING: [
    "Registrar y consultar únicamente sus propias ventas",
    "Consultar y registrar clientes",
    "Consultar inventario en modo vista",
    "Operar caja",
  ],
  ACCOUNTANT: [
    "Consultar compras y ventas",
    "Consultar caja, comprobantes y reportes",
    "Consultar cuentas por pagar",
  ],
};

export class UsersError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
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
} as const;

function assertRole(role: UserRole): asserts role is ManageableRole {
  if (!MANAGEABLE_ROLES.includes(role as ManageableRole)) {
    throw new UsersError("Este rol no está disponible para la gestión de usuarios.");
  }
}

export const usersService = {
  async list(companyId: string) {
    const users = await prisma.user.findMany({
      where: { companyId },
      select: safeSelect,
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    });
    return users.map((user) => ({ ...user, permissions: permissionsForUser(user.role, user.permissions) }));
  },

  async create(
    companyId: string,
    input: { fullName: string; email: string; password: string; role: UserRole; permissions?: Permission[] },
  ) {
    assertRole(input.role);
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new UsersError("Ya existe un usuario con este correo.", 409);

    return prisma.user.create({
      data: {
        companyId,
        fullName: input.fullName.trim(),
        email,
        passwordHash: await passwordService.hash(input.password),
        role: input.role,
        permissions: input.permissions ?? [...ROLE_PERMISSION_DEFAULTS[input.role]],
      },
      select: safeSelect,
    });
  },

  async update(
    companyId: string,
    actorId: string,
    id: string,
    input: { fullName?: string; role?: UserRole; isActive?: boolean; permissions?: Permission[] },
  ) {
    const user = await prisma.user.findFirst({
      where: { id, companyId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user) throw new UsersError("Usuario no encontrado.", 404);
    if (input.role) assertRole(input.role);
    if (
      id === actorId &&
      (input.isActive === false || (input.role && input.role !== UserRole.ADMIN))
    ) {
      throw new UsersError("No puedes desactivar ni quitar tu propio rol de administrador.", 409);
    }

    const removesAdmin =
      user.role === UserRole.ADMIN &&
      (input.isActive === false || (input.role && input.role !== UserRole.ADMIN));
    if (removesAdmin) {
      const admins = await prisma.user.count({
        where: { companyId, role: UserRole.ADMIN, isActive: true },
      });
      if (admins <= 1)
        throw new UsersError("Debe mantenerse al menos un administrador activo.", 409);
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.permissions ? { permissions: input.permissions } : input.role ? { permissions: [...ROLE_PERMISSION_DEFAULTS[input.role]] } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: safeSelect,
    });
  },

  roles() {
    return MANAGEABLE_ROLES.map((role) => ({ role, permissions: ROLE_PERMISSIONS[role] }));
  },
  permissions() {
    return PERMISSIONS;
  },
};
