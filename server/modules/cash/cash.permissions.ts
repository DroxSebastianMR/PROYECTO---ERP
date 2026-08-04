import type { UserRole } from "@prisma/client";

export type CashPermission = "CAJA_APERTURA" | "CAJA_ARQUEO" | "CAJA_CIERRE" | "CAJA_MOVIMIENTO";

const allowedRoles: Record<CashPermission, UserRole[]> = {
  CAJA_APERTURA: ["ADMIN", "MANAGER", "SALES_PURCHASING"],
  CAJA_ARQUEO: ["ADMIN", "MANAGER", "SALES_PURCHASING", "ACCOUNTANT"],
  CAJA_CIERRE: ["ADMIN", "MANAGER", "SALES_PURCHASING", "ACCOUNTANT"],
  CAJA_MOVIMIENTO: ["ADMIN", "MANAGER", "SALES_PURCHASING", "ACCOUNTANT"],
};

export const canUseCashPermission = (role: UserRole, permission: CashPermission) =>
  allowedRoles[permission].includes(role);
