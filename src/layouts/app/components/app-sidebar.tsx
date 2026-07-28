import {
  Archive,
  BarChart3,
  CircleUserRound,
  ClipboardList,
  Cog,
  CreditCard,
  LayoutDashboard,
  Landmark,
  LogOut,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Users,
  Warehouse,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

const navigation = [
  ["Dashboard", LayoutDashboard, PATHS.APP.DASHBOARD],
  ["Productos", Package, PATHS.APP.PRODUCTS],
  ["Inventario", Warehouse, PATHS.APP.INVENTORY],
  ["Compras", ShoppingCart, PATHS.APP.PURCHASES],
  ["Ventas", Tag, PATHS.APP.SALES],
  ["Clientes", Users],
  ["Caja", CreditCard],
  ["Comprobantes", ClipboardList],
  ["SUNAT", Landmark],
  ["Reportes", BarChart3],
  ["Usuarios", CircleUserRound, PATHS.APP.USERS],
  ["Configuración", Cog],
] as const;

export const AppSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    void logout();
    navigate(PATHS.AUTH.LOGIN, { replace: true });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] flex-col border-r border-slate-200 bg-white lg:flex">
    <div className="px-6 pb-4 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-blue-100">
          <Archive className="h-[18px] w-[18px]" />
        </div>
        <div>
          <p className="text-[24px] font-bold leading-6 tracking-[-.055em] text-blue-700">
            DistriCorp
          </p>
          <p className="mt-1 text-[11px] text-slate-600">Gestión Empresarial</p>
        </div>
      </div>
      <Link
        to={PATHS.APP.NEW_SALE}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800"
      >
        <Plus className="h-[18px] w-[18px]" /> + Nueva Venta
      </Link>
    </div>
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
      {navigation.map(([label, Icon, path]) =>
        path ? (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-3.5 rounded-lg px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100",
                isActive && "bg-blue-600 text-white hover:bg-blue-600",
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ) : (
          <button
            key={label}
            className="flex h-11 w-full items-center gap-3.5 rounded-lg px-4 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </button>
        ),
      )}
    </nav>
    <div className="border-t border-slate-200 p-4">
      <button className="flex h-10 w-full items-center gap-4 rounded-lg px-4 text-sm text-slate-600 hover:bg-slate-100">
        <CircleUserRound className="h-5 w-5" />
        Perfil
      </button>
      <button
        type="button"
        onClick={handleLogout}
        className="flex h-10 w-full items-center gap-4 rounded-lg px-4 text-sm text-slate-600 hover:bg-slate-100"
      >
        <LogOut className="h-5 w-5" />
        Cerrar Sesión
      </button>
    </div>
    </aside>
  );
};
