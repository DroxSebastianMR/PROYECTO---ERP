import { hasPermission, type Permission } from "../auth/permissions.js";

export type CashPermission = "CAJA_APERTURA" | "CAJA_ARQUEO" | "CAJA_CIERRE" | "CAJA_MOVIMIENTO";

const requiredPermission: Record<CashPermission, Permission> = {
  CAJA_APERTURA: "cash.sessions.manage",
  CAJA_ARQUEO: "cash.sessions.manage",
  CAJA_CIERRE: "cash.sessions.manage",
  CAJA_MOVIMIENTO: "cash.movements.manage",
};

export const canUseCashPermission = (permissions: readonly string[], permission: CashPermission) =>
  hasPermission(permissions, requiredPermission[permission]);
