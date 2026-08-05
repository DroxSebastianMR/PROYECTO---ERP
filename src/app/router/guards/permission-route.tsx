import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { canAccessPath } from "@/lib/access-control";

export const PermissionRoute = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!canAccessPath(user ?? undefined, location.pathname as (typeof PATHS.APP)[keyof typeof PATHS.APP])) return <Navigate to={PATHS.APP.PROFILE} replace />;
  return <Outlet />;
};
