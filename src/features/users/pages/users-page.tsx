import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  CircleUserRound,
  Eye,
  Mail,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/features/users/hooks/use-users";
import { UserFormModal } from "@/features/users/components/user-form-modal";
import { RoleManagementTab } from "@/features/users/components/role-management-tab";
import { ROLE_LABELS, type ManagedUserRole } from "@/features/users/types/user.types";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";

const roleTone: Record<ManagedUserRole, string> = {
  ADMIN: "bg-blue-100 text-blue-700",
  MANAGER: "bg-cyan-100 text-cyan-700",
  SALES_PURCHASING: "bg-emerald-100 text-emerald-700",
  ACCOUNTANT: "bg-violet-100 text-violet-700",
  WAREHOUSE: "bg-amber-100 text-amber-700",
};
const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" });

export const UsersPage = () => {
  const state = useUsers();
  const [moduleTab, setModuleTab] = useState<"users" | "roles">("users");
  const [permissionsTab, setPermissionsTab] = useState<"role" | "additional" | "recovery">("role");
  const [additionalPermissionsDraft, setAdditionalPermissionsDraft] = useState<string[]>([]);
  const [permissionsSaved, setPermissionsSaved] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState({ personalEmail: "", dni: "" });
  const [recoverySaved, setRecoverySaved] = useState(false);
  const rolePermissions = useMemo(
    () =>
      state.roles.find((definition) => definition.role === state.permissionsUser?.role)
        ?.permissions ?? [],
    [state.permissionsUser?.role, state.roles],
  );
  const availableAdditionalPermissions = useMemo(
    () => state.permissions.filter((permission) => !rolePermissions.includes(permission)),
    [rolePermissions, state.permissions],
  );

  useEffect(() => {
    if (state.permissionsUser) {
      setPermissionsTab("role");
      setAdditionalPermissionsDraft(state.permissionsUser.additionalPermissions);
      setPermissionsSaved(false);
      setRecoveryDraft({
        personalEmail: state.permissionsUser.personalEmail ?? "",
        dni: state.permissionsUser.dni ?? "",
      });
      setRecoverySaved(false);
    }
  }, [state.permissionsUser?.id]);

  const saveAdditionalPermissions = async () => {
    const user = state.permissionsUser;
    if (!user) return;

    await state.updateUser(user.id, { permissions: additionalPermissionsDraft });
    setPermissionsSaved(true);
  };
  const saveRecoveryDetails = async () => {
    const user = state.permissionsUser;
    if (!user) return;
    await state.updateUser(user.id, recoveryDraft);
    setRecoverySaved(true);
  };
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
          <Button onClick={() => state.setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        </div>
      </header>
      <div className="mt-6 flex w-fit rounded-xl border border-slate-200 bg-white p-1"><button type="button" onClick={() => setModuleTab("users")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${moduleTab === "users" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"}`}>Usuarios</button><button type="button" onClick={() => setModuleTab("roles")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${moduleTab === "roles" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"}`}>Roles y permisos</button></div>
      {state.error && (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {moduleTab === "users" && <><section className="mt-6 grid gap-4 sm:grid-cols-3">
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
            {(["ALL", "ADMIN", "MANAGER", "SALES_PURCHASING", "ACCOUNTANT", "WAREHOUSE"] as const).map((role) => (
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
                      <option value="MANAGER">Supervisor</option>
                      <option value="WAREHOUSE">Almacén</option>
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
      </>}
      {moduleTab === "roles" && <section className="mt-6"><RoleManagementTab roles={state.roles} permissions={state.permissions} accessRoles={state.accessRoles} isSaving={state.isSubmitting} onUpdateRole={state.updateRolePermissions} onCreateRole={state.createAccessRole} /></section>}
      <UserFormModal
        isOpen={state.isFormOpen}
        onClose={() => state.setIsFormOpen(false)}
        onSubmit={state.createUser}
        isSubmitting={state.isSubmitting}
        roles={state.roles}
      />
      <Dialog
        isOpen={!!state.permissionsUser}
        onClose={() => state.setPermissionsUser(null)}
        title={`Permisos de ${state.permissionsUser?.fullName ?? ""}`}
        maxWidth="xl"
        description="Los permisos se asignan de forma segura según el rol."
        headerClassName="relative overflow-hidden border-b-0 bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 px-6 py-5"
        titleClassName="text-white"
        descriptionClassName="text-blue-100"
        headerIcon={<span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white"><ShieldCheck className="h-5 w-5" /></span>}
      >
        <div className="space-y-5">
          <div className="grid rounded-xl bg-slate-100 p-1 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setPermissionsTab("role")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${permissionsTab === "role" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <LockKeyhole className="h-4 w-4" />
              Permisos del rol ({rolePermissions.length})
            </button>
            <button
              type="button"
              onClick={() => setPermissionsTab("additional")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${permissionsTab === "additional" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Plus className="h-4 w-4" />
              Acciones adicionales ({state.permissionsUser?.additionalPermissions.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setPermissionsTab("recovery")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${permissionsTab === "recovery" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Mail className="h-4 w-4" />
              Recuperación
            </button>
          </div>

          {permissionsTab === "role" ? (
            <div>
              <p className="mb-3 text-sm text-slate-500">
                Estos accesos los recibe por su rol y no se pueden quitar desde este usuario.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {rolePermissions.map((permission) => (
                  <div key={permission} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="font-medium text-slate-700">
                      {PERMISSION_LABELS[permission as Permission] ?? permission}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Por rol</span>
                  </div>
                ))}
              </div>
            </div>
          ) : permissionsTab === "additional" ? (
            <div>
              <p className="mb-3 text-sm text-slate-500">
                Agrega acciones puntuales sin modificar los permisos base del rol.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableAdditionalPermissions.map((permission) => (
                  <label key={permission} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
                    <input
                      type="checkbox"
                      checked={additionalPermissionsDraft.includes(permission)}
                      disabled={state.isSubmitting}
                      onChange={(event) => {
                        setPermissionsSaved(false);
                        setAdditionalPermissionsDraft((permissions) =>
                          event.target.checked
                            ? [...permissions, permission]
                            : permissions.filter((item) => item !== permission),
                        );
                      }}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
                    />
                    {PERMISSION_LABELS[permission as Permission] ?? permission}
                  </label>
                ))}
              </div>
              {!availableAdditionalPermissions.length && (
                <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Este rol ya incluye todas las acciones disponibles.
                </p>
              )}
              {!!availableAdditionalPermissions.length && (
                <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  {permissionsSaved && (
                    <span className="text-xs font-medium text-emerald-700">
                      Permisos guardados correctamente.
                    </span>
                  )}
                  <Button
                    type="button"
                    onClick={() => void saveAdditionalPermissions()}
                    disabled={state.isSubmitting}
                  >
                    {state.isSubmitting ? "Guardando..." : "Guardar permisos"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div>
                <p className="font-semibold text-slate-800">Datos de recuperación</p>
                <p className="mt-1 text-sm text-slate-500">El enlace de recuperación se enviará únicamente al correo personal registrado.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Correo personal
                  <Input type="email" value={recoveryDraft.personalEmail} onChange={(event) => { setRecoverySaved(false); setRecoveryDraft((draft) => ({ ...draft, personalEmail: event.target.value })); }} placeholder="nombre@gmail.com" className="mt-1.5" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  DNI
                  <Input inputMode="numeric" maxLength={8} value={recoveryDraft.dni} onChange={(event) => { setRecoverySaved(false); setRecoveryDraft((draft) => ({ ...draft, dni: event.target.value.replace(/\D/g, "") })); }} placeholder="8 dígitos" className="mt-1.5" />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-blue-100 pt-4">
                {recoverySaved && <span className="text-xs font-medium text-emerald-700">Datos de recuperación guardados.</span>}
                <Button type="button" onClick={() => void saveRecoveryDetails()} disabled={state.isSubmitting || !recoveryDraft.personalEmail || recoveryDraft.dni.length !== 8}>
                  {state.isSubmitting ? "Guardando..." : "Guardar datos"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
