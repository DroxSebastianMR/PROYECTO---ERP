import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/layouts/app/components/app-sidebar";
import { AppHeader } from "@/layouts/app/components/app-header";

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900 lg:pl-[256px]">
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
        />
      )}
      <AppHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="min-h-screen pt-[60px]">
        <Outlet />
      </main>
    </div>
  );
};
