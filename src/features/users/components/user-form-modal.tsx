import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateUserInput, ManagedUserRole } from "@/features/users/types/user.types";
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permissions";
import type { UserRoleDefinition } from "@/features/users/types/user.types";

type Props = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateUserInput) => Promise<unknown>;
  roles: UserRoleDefinition[];
};
export const UserFormModal = ({ isOpen, isSubmitting, onClose, onSubmit, roles }: Props) => {
  const [activeTab, setActiveTab] = useState<"account" | "permissions">("account");
  const [form, setForm] = useState<CreateUserInput>({
    fullName: "",
    email: "",
    password: "",
    role: "SALES_PURCHASING",
    permissions: [],
  });
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit(form);
      setForm({ fullName: "", email: "", password: "", role: "SALES_PURCHASING", permissions: [] });
      setActiveTab("account");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear el usuario.");
    }
  };
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo usuario"
      description="Crea una cuenta y asigna el nivel de acceso inicial."
      maxWidth="md"
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setActiveTab("account")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === "account" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Datos de cuenta</button><button type="button" onClick={() => setActiveTab("permissions")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === "permissions" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Permisos adicionales</button></div>
        {activeTab === "account" && <><label className="block text-sm font-medium text-slate-700">
          Nombre completo
          <Input
            required
            minLength={3}
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            placeholder="Ej. María López"
            className="mt-1.5"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Correo electrónico
          <Input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="usuario@empresa.pe"
            className="mt-1.5"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Contraseña temporal
          <Input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Mínimo 8 caracteres"
            className="mt-1.5"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Rol
          <select
            value={form.role}
            onChange={(event) => {
              const role = event.target.value as ManagedUserRole;
              setForm({ ...form, role, permissions: [] });
            }}
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"
          >
            <option value="SALES_PURCHASING">Vendedor</option>
            <option value="ACCOUNTANT">Contador</option>
            <option value="ADMIN">Administrador</option>
            <option value="MANAGER">Supervisor</option>
            <option value="WAREHOUSE">Almacén</option>
          </select>
        </label></>}
        {activeTab === "permissions" && <fieldset>
          <legend className="text-sm font-medium text-slate-700">Permisos adicionales</legend>
          <p className="mt-1 text-xs text-slate-500">El rol aporta sus accesos base desde la base de datos. Marca solo los accesos extra para este usuario.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((permission) => (
              <label key={permission} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={roles.find((item) => item.role === form.role)?.permissions.includes(permission) || form.permissions.includes(permission)}
                  disabled={roles.find((item) => item.role === form.role)?.permissions.includes(permission)}
                  onChange={(event) => setForm({ ...form, permissions: event.target.checked ? [...form.permissions, permission] : form.permissions.filter((item) => item !== permission) })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                {PERMISSION_LABELS[permission as Permission]}
              </label>
            ))}
          </div>
        </fieldset>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type={activeTab === "account" ? "submit" : "button"} onClick={activeTab === "permissions" ? () => setActiveTab("account") : undefined} disabled={isSubmitting}>
            <UserPlus className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creando..." : activeTab === "permissions" ? "Revisar datos" : "Crear usuario"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
