import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PERMISSIONS, type Permission } from "./permissions.js";

const legacyPermissionMap: Record<string, Permission> = {
  DASHBOARD_VIEW: "dashboard.access",
  PRODUCTS_VIEW: "products.catalog.access",
  PRODUCTS_MANAGE: "products.catalog.manage",
  INVENTORY_VIEW: "inventory.stock.access",
  INVENTORY_MANAGE: "inventory.adjustments.manage",
  PURCHASES_VIEW: "purchases.orders.access",
  PURCHASES_MANAGE: "purchases.orders.manage",
  SALES_VIEW_OWN: "sales.history.view_own",
  SALES_VIEW_ALL: "sales.history.view_all",
  SALES_MANAGE: "sales.new_sale.create",
  CUSTOMERS_VIEW: "customers.access",
  CUSTOMERS_MANAGE: "customers.manage",
  CASH_VIEW: "cash.access",
  CASH_MANAGE: "cash.sessions.manage",
  REPORTS_VIEW: "reports.access",
  USERS_MANAGE: "users.manage",
};

const normalize = (codes: readonly string[]) =>
  [...new Set(codes.map((code) => legacyPermissionMap[code] ?? code).filter((code): code is Permission => PERMISSIONS.includes(code as Permission)))];

const fallbackRolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [...PERMISSIONS],
  MANAGER: [...PERMISSIONS],
  SALES_PURCHASING: ["sales.access", "sales.new_sale.access", "sales.new_sale.create", "sales.history.access", "sales.history.view_own", "customers.access", "customers.manage", "inventory.access", "inventory.stock.access", "inventory.movements.access", "cash.access", "cash.sessions.manage", "cash.movements.manage"],
  ACCOUNTANT: ["dashboard.access", "purchases.access", "purchases.orders.access", "purchases.suppliers.access", "sales.access", "sales.history.access", "sales.history.view_all", "customers.access", "cash.access", "reports.access", "reports.export"],
  WAREHOUSE: ["products.access", "products.catalog.access", "products.categories.access", "products.units.access", "products.barcodes.access", "inventory.access", "inventory.stock.access", "inventory.movements.access", "inventory.transfers.access", "inventory.transfers.manage", "inventory.adjustments.access", "inventory.adjustments.manage", "inventory.warehouses.access"],
};

export const permissionService = {
  normalize,

  async resolveEffectivePermissions(user: { id: string; role: UserRole; permissions?: readonly string[] }) {
    try {
      const [rolePermissions, userPermissions] = await Promise.all([
        prisma.rolePermission.findMany({ where: { role: user.role, permission: { isActive: true } }, select: { permission: { select: { code: true } } } }),
        prisma.userPermission.findMany({ where: { userId: user.id, permission: { isActive: true } }, select: { permission: { select: { code: true } } } }),
      ]);
      return normalize([...rolePermissions.map(({ permission }) => permission.code), ...userPermissions.map(({ permission }) => permission.code), ...(user.permissions ?? [])]);
    } catch {
      return normalize([...fallbackRolePermissions[user.role], ...(user.permissions ?? [])]);
    }
  },

  async listRolePermissions(role: UserRole) {
    try {
      const rows = await prisma.rolePermission.findMany({ where: { role, permission: { isActive: true } }, select: { permission: { select: { code: true } } }, orderBy: { permission: { code: "asc" } } });
      return normalize(rows.map(({ permission }) => permission.code));
    } catch {
      return fallbackRolePermissions[role];
    }
  },

  async replaceRolePermissions(role: UserRole, codes: readonly string[]) {
    const definitions = await prisma.permissionDefinition.findMany({ where: { code: { in: normalize(codes) }, isActive: true }, select: { id: true } });
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role } }),
      ...(definitions.length ? [prisma.rolePermission.createMany({ data: definitions.map(({ id: permissionId }) => ({ role, permissionId })) })] : []),
    ]);
  },

  async replaceUserAdditionalPermissions(userId: string, codes: readonly string[]) {
    const normalized = normalize(codes);
    const definitions = await prisma.permissionDefinition.findMany({
      where: { code: { in: normalized }, isActive: true },
      select: { id: true },
    });
    await prisma.$transaction([
      prisma.userPermission.deleteMany({ where: { userId } }),
      ...(definitions.length
        ? [prisma.userPermission.createMany({ data: definitions.map(({ id: permissionId }) => ({ userId, permissionId })) })]
        : []),
    ]);
  },
};
