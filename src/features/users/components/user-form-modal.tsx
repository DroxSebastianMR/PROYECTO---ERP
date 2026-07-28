import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateUserInput, ManagedUserRole } from "@/features/users/types/user.types";

type Props = { isOpen: boolean; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CreateUserInput) => Promise<unknown> };
export const UserFormModal = ({ isOpen, isSubmitting, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<CreateUserInput>({ fullName: "", email: "", password: "", role: "SALES_PURCHASING" });
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    try { await onSubmit(form); setForm({ fullName: "", email: "", password: "", role: "SALES_PURCHASING" }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo crear el usuario."); }
  };
  return <Dialog isOpen={isOpen} onClose={onClose} title="Nuevo usuario" description="Crea una cuenta y asigna el nivel de acceso inicial." maxWidth="md">
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <label className="block text-sm font-medium text-slate-700">Nombre completo<Input required minLength={3} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Ej. María López" className="mt-1.5" /></label>
      <label className="block text-sm font-medium text-slate-700">Correo electrónico<Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="usuario@empresa.pe" className="mt-1.5" /></label>
      <label className="block text-sm font-medium text-slate-700">Contraseña temporal<Input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Mínimo 8 caracteres" className="mt-1.5" /></label>
      <label className="block text-sm font-medium text-slate-700">Rol<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as ManagedUserRole })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"><option value="SALES_PURCHASING">Vendedor</option><option value="ACCOUNTANT">Contador</option><option value="ADMIN">Administrador</option></select></label>
      <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button><Button type="submit" disabled={isSubmitting}><UserPlus className="mr-2 h-4 w-4" />{isSubmitting ? "Creando..." : "Crear usuario"}</Button></div>
    </form>
  </Dialog>;
};
