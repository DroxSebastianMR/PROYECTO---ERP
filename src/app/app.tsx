import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/app/router/app-router";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { QueryProvider } from "@/app/providers/query-provider";

export const App = () => (
  <QueryProvider>
    <AuthProvider>
      <RouterProvider router={appRouter} />
    </AuthProvider>
  </QueryProvider>
);
