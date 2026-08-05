import { PATHS } from "@/app/router/constants/paths";
import { type AuthenticatedUser, UserRole } from "@/features/auth/types/auth.types";
import { hasAnyPermission, permissionsForPath, ROLE_PERMISSION_DEFAULTS } from "@/lib/permissions";

type AppPath = (typeof PATHS.APP)[keyof typeof PATHS.APP];

const rolePaths: Record<UserRole, readonly AppPath[]> = {
  [UserRole.ADMIN]: Object.values(PATHS.APP),
  [UserRole.MANAGER]: Object.values(PATHS.APP),
  [UserRole.SALES_PURCHASING]: [PATHS.APP.SALES, PATHS.APP.NEW_SALE, PATHS.APP.CUSTOMERS, PATHS.APP.INVENTORY, PATHS.APP.CASH, PATHS.APP.PROFILE],
  [UserRole.ACCOUNTANT]: [PATHS.APP.DASHBOARD, PATHS.APP.PURCHASES, PATHS.APP.SALES, PATHS.APP.CASH, PATHS.APP.CUSTOMERS, PATHS.APP.PROFILE],
  [UserRole.WAREHOUSE]: [PATHS.APP.INVENTORY, PATHS.APP.PRODUCTS, PATHS.APP.PROFILE],
};

export const canAccessPath = (user: Pick<AuthenticatedUser, "role" | "permissions"> | undefined, path: AppPath) => {
  if (!user || path === PATHS.APP.PROFILE) return Boolean(user);
  // Sessions created before granular permissions did not persist this field.
  const permissions = user.permissions?.length ? user.permissions : ROLE_PERMISSION_DEFAULTS[user.role];
  return hasAnyPermission(permissions, permissionsForPath(path));
};
export const accessiblePaths = (role: UserRole | undefined) => role ? rolePaths[role] : [];
