import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { PurchaseOrder } from "@/features/purchases/types/purchase.types";
import { Building2, CalendarDays, CheckCircle2, CreditCard, FilePenLine, PackageCheck, ReceiptText, Send, Truck } from "lucide-react";

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: PurchaseOrder | null;
  onOrder: (id: string) => Promise<unknown>;
  onReceive: (purchase: PurchaseOrder) => Promise<unknown>;
  onEdit: () => void;
  isSubmitting: boolean;
}

export const PurchaseDetailModal = ({ isOpen, onClose, purchase, onOrder, onReceive, onEdit, isSubmitting }: PurchaseDetailModalProps) => {
  if (!purchase) return null;
  const formatPrice = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: purchase.currency || "PEN" }).format(value);
  const isReceived = ["PENDING_PAYMENT", "PAID", "RECEIVED"].includes(purchase.status);
  const canReceive = !isReceived && purchase.status !== "CANCELLED";
  const isDraft = purchase.status === "DRAFT";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Detalle de compra ${purchase.number}`} description="Resumen comercial y control de recepción de mercadería." maxWidth="2xl" headerClassName="bg-gradient-to-r from-blue-700 to-indigo-700" titleClassName="text-white" descriptionClassName="text-blue-100" headerIcon={<span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white"><ReceiptText className="h-5 w-5" /></span>}>
      <div className="space-y-5">
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm"><Truck className="h-6 w-6" /></span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-blue-700">Compra registrada</p><p className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-900">{purchase.number}</p><p className="mt-1 text-sm text-slate-600">Comprobante proveedor: <strong>{purchase.supplierDocumentNumber || "Sin número"}</strong></p></div></div>
            {isReceived ? <Badge variant="success">Comprada · Recepcionada</Badge> : isDraft ? <Badge variant="secondary">Pendiente de confirmar</Badge> : <Badge variant="warning">Comprada</Badge>}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={<Building2 className="h-5 w-5" />} label="Proveedor" value={purchase.supplierName} />
            <InfoCard icon={<CreditCard className="h-5 w-5" />} label="Moneda" value={purchase.currency === "USD" ? "Dólares (USD)" : "Soles (PEN)"} />
            <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Fecha de compra" value={new Date(purchase.purchasedAt || purchase.createdAt).toLocaleDateString("es-PE")} />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4"><div><h4 className="flex items-center gap-2 font-bold text-slate-900"><PackageCheck className="h-4 w-4 text-blue-600" /> Productos de la compra</h4><p className="mt-1 text-sm text-slate-500">{purchase.items.length} producto(s) registrado(s) en esta compra.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{purchase.items.length} ítems</span></div>
          <div className="overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50/40 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Producto</th><th className="px-5 py-3 text-center">Cantidad</th><th className="px-5 py-3 text-right">Costo unit.</th><th className="px-5 py-3 text-right">Importe</th></tr></thead><tbody className="divide-y divide-slate-100">{purchase.items.map((item) => <tr key={item.id || item.productId}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{item.productName}</p><p className="mt-0.5 font-mono text-xs text-slate-400">{item.sku}</p></td><td className="px-5 py-4 text-center font-semibold text-slate-700">{item.quantity} {item.unit}</td><td className="px-5 py-4 text-right text-slate-600">{formatPrice(item.unitCost)}</td><td className="px-5 py-4 text-right font-bold text-slate-900">{formatPrice(item.subtotal)}</td></tr>)}</tbody></table></div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4"><span className="font-semibold text-slate-700">Total de compra</span><span className="text-2xl font-bold tracking-tight text-emerald-600">{formatPrice(purchase.total)}</span></div>
        </section>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">{isReceived ? "La mercadería fue recepcionada e ingresó al inventario." : "La compra está registrada. El inventario se actualizará al recepcionar la mercadería."}</p><div className="flex justify-end gap-3"><Button variant="ghost" onClick={onEdit} disabled={isSubmitting} className="gap-2"><FilePenLine className="h-4 w-4" /> Editar</Button>{isDraft && <Button onClick={() => void onOrder(purchase.id)} disabled={isSubmitting} variant="ghost" className="gap-2"><Send className="h-4 w-4" /> Ordenar</Button>}<Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cerrar</Button>{canReceive && <Button onClick={() => void onReceive(purchase)} disabled={isSubmitting || isDraft} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />{isSubmitting ? "Procesando..." : "Recepcionar compra"}</Button>}</div></div>
      </div>
    </Dialog>
  );
};

const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => <div className="rounded-xl border border-white/80 bg-white/80 p-3"><span className="text-blue-600">{icon}</span><p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-bold text-slate-800">{value}</p></div>;
