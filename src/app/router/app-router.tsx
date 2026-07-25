import { createBrowserRouter, Navigate } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { publicRoutes } from "@/app/router/routes/public.routes";
import { protectedRoutes } from "@/app/router/routes/protected.routes";

export const appRouter = createBrowserRouter([
  { path: "/", element: <Navigate to={PATHS.APP.DASHBOARD} replace /> },
  ...publicRoutes,
  ...protectedRoutes,
]);
