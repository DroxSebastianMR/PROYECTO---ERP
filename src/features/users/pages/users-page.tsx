import { useMemo } from "react";
import {
  BadgeCheck,
  CircleUserRound,
  Eye,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/features/users/hooks/use-users";
import { UserFormModal } from "@/features/users/components/user-form-modal";
import { ROLE_LABELS, type ManagedUserRole } from "@/features/users/types/user.types";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";

const roleTone: Record<ManagedUserRole, string> = {
  ADMIN: "bg-blue-100 text-blue-700",
  SALES_PURCHASING: "bg-emerald-100 text-emerald-700",
  ACCOUNTANT: "bg-violet-100 text-violet-700",
};
const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" });

export const UsersPage = () => {
  const state = useUsers();
  const metrics = useMemo(
    () => ({
      active: state.allUsers.filter((item) => item.isActive).length,
      admins: state.allUsers.filter((item) => item.role === "ADMIN" && item.isActive).length,
      operational: state.allUsers.filter(
        (item) => item.role === "SALES_PURCHASING" && item.isActive,
      ).length,
    }),
    [state.allUsers],
  );
  if (state.isLoading)
    return (
      <div className="mx-auto flex min-h-64 max-w-[1480px] items-center justify-center p-7 text-sm text-slate-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" />
        Cargando usuarios...
      </div>
    );
  return (
    <div className="mx-auto max-w-[1480px] p-5 sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-[30px] font-bold tracking-[-.045em] text-slate-900">
            <UsersRound className="h-8 w-8 text-blue-600" />
            Usuarios y permisos
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Administra accesos de vendedores, contadores y administradores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => void state.refresh()}
            disabled={state.isRefreshing}
            className="border border-slate-200 bg-white text-slate-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${state.isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={() => state.setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        </div>
      </header>
      {state.error && (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Usuarios activos", metrics.active, UsersRound, "text-blue-600 bg-blue-50"],
          ["Administradores", metrics.admins, ShieldCheck, "text-violet-600 bg-violet-50"],
          ["Vendedores activos", metrics.operational, BadgeCheck, "text-emerald-600 bg-emerald-50"],
        ].map(([label, value, Icon, tone]) => {
          const MetricIcon = Icon as typeof UsersRound;
          return (
            <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label as string}</p>
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone as string}`}>
                  <MetricIcon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {value as number}
              </p>
            </div>
          );
        })}
      </section>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={state.search}
              onChange={(event) => state.setSearch(event.target.value)}
              placeholder="Buscar por nombre o correo"
              className="pl-9"
            />
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(["ALL", "ADMIN", "SALES_PURCHASING", "ACCOUNTANT"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => state.setRole(role)}
                className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition ${state.role === role ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
              >
                {role === "ALL" ? "Todos" : ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Usuario</th>
                <th className="px-5 py-3 font-semibold">Rol</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Último acceso</th>
                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.users.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {user.fullName.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{user.fullName}</p>
                        <p className="text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(event) =>
                        void state.updateUser(user.id, {
                          role: event.target.value as ManagedUserRole,
                        })
                      }
                      disabled={state.isSubmitting}
                      className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${roleTone[user.role]}`}
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="SALES_PURCHASING">Vendedor</option>
                      <option value="ACCOUNTANT">Contador</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => void state.updateUser(user.id, { isActive: !user.isActive })}
                      disabled={state.isSubmitting}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {user.lastLoginAt
                      ? dateFormat.format(new Date(user.lastLoginAt))
                      : "Sin ingreso"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => state.setPermissionsUser(user)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4" />
                      Permisos
                    </button>
                  </td>
                </tr>
              ))}
              {!state.users.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <CircleUserRound className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {state.roles.map((definition) => (
          <article
            key={definition.role}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">{ROLE_LABELS[definition.role]}</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {definition.permissions.map((permission) => (
                <li key={permission} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  {PERMISSION_LABELS[permission as Permission] ?? permission}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <UserFormModal
        isOpen={state.isFormOpen}
        onClose={() => state.setIsFormOpen(false)}
        onSubmit={state.createUser}
        isSubmitting={state.isSubmitting}
      />
      <Dialog
        isOpen={!!state.permissionsUser}
        onClose={() => state.setPermissionsUser(null)}
        title={`Permisos de ${state.permissionsUser?.fullName ?? ""}`}
        description="Los permisos se asignan de forma segura según el rol."
      >
        <div className="space-y-3">
          {state.permissions.map((permission) => (
            <label key={permission} className="flex cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-3 py-3 text-sm text-blue-900">
              <input
                type="checkbox"
                checked={state.permissionsUser?.permissions.includes(permission) ?? false}
                disabled={state.isSubmitting}
                onChange={(event) => {
                  const user = state.permissionsUser;
                  if (!user) return;
                  if (!event.target.checked && user.permissions.length === 1) return;
                  const permissions = event.target.checked ? [...user.permissions, permission] : user.permissions.filter((item) => item !== permission);
                  state.setPermissionsUser({ ...user, permissions });
                  void state.updateUser(user.id, { permissions });
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              {PERMISSION_LABELS[permission as Permission] ?? permission}
            </label>
          ))}
        </div>
      </Dialog>
    </div>
  );
};
