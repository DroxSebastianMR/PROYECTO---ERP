import { AuthHero } from "@/features/auth/components/auth-hero";
import { Outlet } from "react-router-dom";

export const AuthLayout = () => (
  <main className="grid min-h-screen lg:h-screen lg:grid-cols-2">
    <AuthHero />
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-10 sm:px-12 lg:min-h-0 lg:px-16 xl:px-24">
      <div className="w-full max-w-[400px]">
        <Outlet />
      </div>
    </section>
  </main>
);
