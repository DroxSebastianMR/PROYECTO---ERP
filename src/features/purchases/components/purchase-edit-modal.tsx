import { useEffect, useState, type FormEvent } from "react";
import { FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { PurchaseOrder, PurchasePaymentMethod, SupplierOption, UpdatePurchaseInput } from "@/features/purchases/types/purchase.types";

interface PurchaseEditModalProps {
  purchase: PurchaseOrder | null;
  suppliers: SupplierOption[];
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (id: string, input: UpdatePurchaseInput) => Promise<unknown>;
}

const dateValue = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

export const PurchaseEditModal = ({ purchase, suppliers, isOpen, isSubmitting, onClose, onSubmit }: PurchaseEditModalProps) => {
  const [supplierId, setSupplierId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [warehouseEntryAt, setWarehouseEntryAt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>("CASH");
  const [currency, setCurrency] = useState("PEN");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (!purchase || !isOpen) return;
    setSupplierId(purchase.supplierId ?? ""); setDocumentNumber(purchase.supplierDocumentNumber ?? "");
    setPurchasedAt(dateValue(purchase.purchasedAt)); setWarehouseEntryAt(dateValue(purchase.warehouseEntryAt));
    setPaymentMethod(purchase.paymentMethod ?? "CASH"); setCurrency(purchase.currency); setNotes(purchase.notes ?? "");
  }, [purchase, isOpen]);
  if (!purchase) return null;
  const submit = async (event: FormEvent) => { event.preventDefault(); await onSubmit(purchase.id, { supplierId: supplierId || undefined, supplierDocumentNumber: documentNumber.trim() || undefined, purchasedAt, warehouseEntryAt, paymentMethod, currency, notes }); };
  return <Dialog isOpen={isOpen} onClose={onClose} title={`Editar compra ${purchase.number}`} description="Corrige los datos comerciales sin modificar existencias ya recepcionadas." maxWidth="xl" headerClassName="bg-gradient-to-r from-blue-700 to-indigo-700" titleClassName="text-white" descriptionClassName="text-blue-100" headerIcon={<span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white"><FilePenLine className="h-5 w-5" /></span>}>
    <form onSubmit={submit} className="space-y-5"><div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">Las cantidades y costos no se editan aquí para proteger el kardex. Puedes actualizar el comprobante, proveedor, fechas y observaciones.</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Proveedor"><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Mantener proveedor actual</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</Select></Field><Field label="N° comprobante"><Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} /></Field><Field label="Fecha de compra"><Input type="date" value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} /></Field><Field label="Fecha de ingreso"><Input type="date" value={warehouseEntryAt} onChange={(e) => setWarehouseEntryAt(e.target.value)} /></Field><Field label="Forma de pago"><Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PurchasePaymentMethod)}><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option><option value="BANK_TRANSFER">Transferencia</option><option value="YAPE_PLIN">Yape / Plin</option></Select></Field><Field label="Moneda"><Select value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="PEN">PEN — Sol peruano</option><option value="USD">USD — Dólar americano</option></Select></Field></div><Field label="Observaciones"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" /></Field><div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar cambios"}</Button></div></form>
  </Dialog>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
