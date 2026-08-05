import { useState, type FormEvent } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CreateWarehouseInput } from "@/features/inventory/types/inventory.types";

interface Props { isOpen: boolean; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CreateWarehouseInput) => Promise<unknown>; }

export const WarehouseFormModal = ({ isOpen, isSubmitting, onClose, onSubmit }: Props) => {
  const [name, setName] = useState(""); const [code, setCode] = useState("");
  const [type, setType] = useState<CreateWarehouseInput["type"]>("DEPOT"); const [address, setAddress] = useState(""); const [isPrimary, setIsPrimary] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); await onSubmit({ name, code: code || undefined, type, address: address || undefined, isPrimary }); setName(""); setCode(""); setType("DEPOT"); setAddress(""); setIsPrimary(false); };
  return <Dialog isOpen={isOpen} onClose={onClose} title="Nuevo almacén" description="Registra una ubicación adicional para controlar sus existencias." maxWidth="md" headerClassName="bg-gradient-to-r from-blue-700 to-indigo-700" titleClassName="text-white" descriptionClassName="text-blue-100" headerIcon={<span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white"><Building2 className="h-5 w-5" /></span>}>
    <form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Nombre del almacén<Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Almacén Norte" required /></label><label className="text-sm font-semibold text-slate-700">Código interno<Input className="mt-1.5" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ej. ALM-NOR" /></label><label className="text-sm font-semibold text-slate-700">Tipo<Select className="mt-1.5" value={type} onChange={(e) => setType(e.target.value as CreateWarehouseInput["type"])}><option value="MAIN">Principal</option><option value="STORE">Tienda</option><option value="DEPOT">Depósito</option><option value="TEMPORARY">Temporal</option></Select></label><label className="text-sm font-semibold text-slate-700">Ubicación / dirección<Input className="mt-1.5" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej. Av. Principal 123" /></label></div><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-700"><input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="h-4 w-4 accent-blue-600" />Definir como almacén principal</label><div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="ghost" disabled={isSubmitting} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Crear almacén"}</Button></div></form>
  </Dialog>;
};
