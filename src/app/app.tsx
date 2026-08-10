import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/app/router/app-router";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { QueryProvider } from "@/app/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";

export const App = () => (
  <QueryProvider>
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={appRouter} />
      </AuthProvider>
    </ToastProvider>
  </QueryProvider>
);
