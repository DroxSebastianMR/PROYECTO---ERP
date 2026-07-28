import { Navigate, Outlet } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AppLoadingSkeleton } from "@/components/ui/app-loading-skeleton";

export const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return <AppLoadingSkeleton />;
  return isAuthenticated ? <Outlet /> : <Navigate to={PATHS.AUTH.LOGIN} replace />;
};
