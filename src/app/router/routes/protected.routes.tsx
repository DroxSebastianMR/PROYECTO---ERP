import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/app/router/guards/protected-route";
import { PATHS } from "@/app/router/constants/paths";
import { AppLayout } from "@/layouts/app/app-layout";
import { DashboardPage } from "@/features/dashboard/pages";

export const protectedRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: PATHS.APP.DASHBOARD, element: <DashboardPage /> }],
      },
    ],
  },
];
