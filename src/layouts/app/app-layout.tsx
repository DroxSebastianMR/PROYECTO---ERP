import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/layouts/app/components/app-sidebar";
import { AppHeader } from "@/layouts/app/components/app-header";

export const AppLayout = () => (
  <div className="min-h-screen bg-[#f7f9fc] text-slate-900 lg:pl-[256px]">
    <AppSidebar />
    <AppHeader />
    <main className="min-h-screen pt-[60px]">
      <Outlet />
    </main>
  </div>
);
