import type { RouteObject } from "react-router-dom";
import { PublicRoute } from "@/app/router/guards/public-route";
import { PATHS } from "@/app/router/constants/paths";
import { AuthLayout } from "@/layouts/auth/auth-layout";
import { LoginPage, RecoverPage, ResetPasswordPage } from "@/features/auth/pages";

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: PATHS.AUTH.LOGIN, element: <LoginPage /> },
          { path: PATHS.AUTH.FORGOT_PASSWORD, element: <RecoverPage /> },
          { path: PATHS.AUTH.RESET_PASSWORD, element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
];
