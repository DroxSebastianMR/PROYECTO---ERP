import type { ReactNode } from "react";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { UserRole } from "@/features/auth/types/auth.types";

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SALES_PURCHASING: "Vendedor",
  ACCOUNTANT: "Contador",
  WAREHOUSE: "Almacén",
};
export const ProfilePage = () => {
  const { user } = useAuth();
  const initials =
    user?.fullName
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "US";
  return (
    <div className="mx-auto max-w-[900px] p-4 sm:p-6 lg:p-7">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-.045em] text-slate-900 sm:text-[30px]">
          <UserRound className="h-8 w-8 text-blue-600" />
          Mi perfil
        </h1>
        <p className="mt-1 text-[15px] text-slate-600">
          Información de tu cuenta y nivel de acceso en Clienty.
        </p>
      </header>
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div className="h-24 bg-gradient-to-r from-blue-700 to-indigo-700" />
        <div className="px-6 pb-7">
          <div className="-mt-10 grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-blue-100 text-xl font-bold text-blue-700 shadow-sm">
            {initials}
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-bold text-slate-900">{user?.fullName ?? "Usuario"}</h2>
            <p className="mt-1 text-sm text-slate-500">Cuenta activa de Clienty</p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Info
              icon={<Mail className="h-5 w-5" />}
              label="Correo electrónico"
              value={user?.email ?? "—"}
            />
            <Info
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Rol asignado"
              value={user ? roleLabel[user.role] : "—"}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
const Info = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
    <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
      {icon}
    </span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);
