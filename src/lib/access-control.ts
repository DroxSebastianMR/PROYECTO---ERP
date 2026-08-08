import { PATHS } from "@/app/router/constants/paths";
import type { AuthenticatedUser } from "@/features/auth/types/auth.types";
import { hasAnyPermission, hasPermission, permissionsForPath, type Permission } from "@/lib/permissions";

type AppPath = (typeof PATHS.APP)[keyof typeof PATHS.APP];

export const can = (user: Pick<AuthenticatedUser, "permissions"> | undefined, permission: Permission) =>
  hasPermission(user?.permissions, permission);

export const canAccessPath = (user: Pick<AuthenticatedUser, "permissions"> | undefined, path: AppPath) => {
  if (path === PATHS.APP.PROFILE) return Boolean(user);
  return hasAnyPermission(user?.permissions, permissionsForPath(path));
};
