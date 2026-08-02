import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Edit3, Plus, Power, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { purchaseService } from "@/features/purchases/services/purchase.service";
import type { Supplier, SupplierInput } from "@/features/purchases/types/purchase.types";

const SUPPLIER_CATALOG_KEY = ["purchases", "supplier-catalog"] as const;
const emptyForm: SupplierInput = { businessName: "", paymentTermsDays: 30 };

export const SupplierMasterTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierInput>(emptyForm);
  const query = useQuery({ queryKey: SUPPLIER_CATALOG_KEY, queryFn: purchaseService.getSupplierCatalog });
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: SUPPLIER_CATALOG_KEY }),
      queryClient.invalidateQueries({ queryKey: ["purchases", "suppliers"] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (input: SupplierInput) => editing ? purchaseService.updateSupplier(editing.id, input) : purchaseService.createSupplier(input),
    onSuccess: async () => { await invalidate(); closeForm(); },
  });
  const changeStatus = useMutation({
    mutationFn: (supplier: Supplier) => purchaseService.updateSupplier(supplier.id, { isActive: !supplier.isActive }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (supplier: Supplier) => purchaseService.deleteSupplier(supplier.id),
    onSuccess: async () => { await invalidate(); setDeleting(null); },
  });
  const suppliers = useMemo(() => (query.data ?? []).filter((supplier) => {
    const value = search.trim().toLowerCase();
    return !value || [supplier.code, supplier.businessName, supplier.tradeName, supplier.ruc, supplier.contactName]
      .filter(Boolean).some((field) => field!.toLowerCase().includes(value));
  }), [query.data, search]);
  const closeForm = () => { setFormOpen(false); setEditing(null); setForm(emptyForm); };
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({ ruc: supplier.ruc ?? "", businessName: supplier.businessName, tradeName: supplier.tradeName ?? "", address: supplier.address ?? "", phone: supplier.phone ?? "", email: supplier.email ?? "", contactName: supplier.contactName ?? "", paymentTermsDays: supplier.paymentTermsDays, isActive: supplier.isActive });
    setFormOpen(true);
  };
  const update = (key: keyof SupplierInput, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.businessName.trim()) return;
    const optional = (value?: string) => value?.trim() || undefined;
    const input: SupplierInput = {
      businessName: form.businessName.trim(),
      ruc: optional(form.ruc),
      tradeName: optional(form.tradeName),
      address: optional(form.address),
      phone: optional(form.phone),
      email: optional(form.email),
      contactName: optional(form.contactName),
      paymentTermsDays: form.paymentTermsDays,
      isActive: form.isActive,
    };
    save.mutate(input);
  };
  const activeCount = (query.data ?? []).filter((supplier) => supplier.isActive).length;

  return <>
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">Proveedores</h2><p className="mt-1 text-sm text-slate-500">Administra los proveedores disponibles para registrar compras.</p></div></div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto"><Plus className="h-4 w-4" /> Nuevo proveedor</Button>
      </div>
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="bg-white pl-9" placeholder="Buscar por código, RUC, nombre o contacto" /></div><p className="text-sm text-slate-500"><strong className="text-slate-800">{activeCount}</strong> activos de {query.data?.length ?? 0}</p></div>
      <div className="overflow-x-auto"><table className="min-w-[920px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">Código</th><th className="px-5 py-3.5">Proveedor</th><th className="px-5 py-3.5">RUC</th><th className="px-5 py-3.5">Contacto</th><th className="px-5 py-3.5">Condición</th><th className="px-5 py-3.5">Estado</th><th className="px-5 py-3.5 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">
        {suppliers.map((supplier) => <tr key={supplier.id} className="transition-colors hover:bg-slate-50/70"><td className="px-5 py-4"><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">{supplier.code}</span></td><td className="px-5 py-4"><p className="font-semibold text-slate-800">{supplier.businessName}</p><p className="mt-0.5 text-xs text-slate-500">{supplier.tradeName || "Sin nombre comercial"}</p></td><td className="px-5 py-4 font-mono text-slate-600">{supplier.ruc || "—"}</td><td className="px-5 py-4"><p className="text-slate-700">{supplier.contactName || "Sin contacto"}</p><p className="mt-0.5 text-xs text-slate-500">{supplier.phone || supplier.email || "Sin datos"}</p></td><td className="px-5 py-4 text-slate-600">{supplier.paymentTermsDays} días</td><td className="px-5 py-4"><span className={supplier.isActive ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"}>{supplier.isActive ? "Activo" : "Inactivo"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEdit(supplier)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600" title="Editar proveedor"><Edit3 className="h-4 w-4" /></button><button onClick={() => changeStatus.mutate(supplier)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600" title={supplier.isActive ? "Desactivar" : "Activar"}><Power className="h-4 w-4" /></button><button onClick={() => setDeleting(supplier)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Eliminar proveedor"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}
        {!query.isLoading && !suppliers.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">No se encontraron proveedores.</td></tr>}
      </tbody></table></div>
    </section>
    <Dialog isOpen={formOpen} onClose={closeForm} title={editing ? "Editar proveedor" : "Nuevo proveedor"} description={editing ? "Actualiza los datos comerciales manteniendo su historial de compras." : "Registra un proveedor. El código interno se generará automáticamente."} maxWidth="2xl" headerClassName="bg-gradient-to-r from-blue-700 to-indigo-700" titleClassName="text-white" descriptionClassName="text-blue-100" headerIcon={<span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white"><Building2 className="h-5 w-5" /></span>}>
      <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Razón social" required><Input autoFocus value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Ej. Distribuidora Andina S.A.C." /></Field><Field label="RUC"><Input value={form.ruc ?? ""} onChange={(e) => update("ruc", e.target.value)} inputMode="numeric" maxLength={15} placeholder="20123456789" /></Field><Field label="Nombre comercial"><Input value={form.tradeName ?? ""} onChange={(e) => update("tradeName", e.target.value)} placeholder="Nombre visible" /></Field><Field label="Contacto"><Input value={form.contactName ?? ""} onChange={(e) => update("contactName", e.target.value)} placeholder="Persona responsable" /></Field><Field label="Teléfono"><Input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} placeholder="999 999 999" /></Field><Field label="Correo"><Input type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} placeholder="ventas@empresa.pe" /></Field><Field label="Días de pago"><Input type="number" min="0" max="365" value={form.paymentTermsDays ?? 30} onChange={(e) => update("paymentTermsDays", Number(e.target.value))} /></Field><Field label="Dirección"><Input value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} placeholder="Dirección fiscal o comercial" /></Field></div><div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="ghost" onClick={closeForm} disabled={save.isPending}>Cancelar</Button><Button type="submit" disabled={save.isPending || !form.businessName.trim()}>{save.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear proveedor"}</Button></div></form>
    </Dialog>
    <Dialog isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} title="Eliminar proveedor" description="La eliminación conserva la trazabilidad comercial." maxWidth="md"><div className="space-y-5"><p className="text-sm leading-6 text-slate-600">{deleting?.purchasesCount ? <>Este proveedor tiene <strong>{deleting.purchasesCount} compra(s)</strong>. Se desactivará y dejará de aparecer al registrar nuevas compras.</> : <>El proveedor no tiene compras asociadas y se eliminará permanentemente.</>}</p><div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setDeleting(null)} disabled={remove.isPending}>Cancelar</Button><Button className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => deleting && remove.mutate(deleting)} disabled={remove.isPending}>{remove.isPending ? "Procesando..." : deleting?.purchasesCount ? "Desactivar proveedor" : "Eliminar proveedor"}</Button></div></div></Dialog>
  </>;
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => <label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
