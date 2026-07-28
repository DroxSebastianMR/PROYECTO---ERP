import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PurchaseOrder } from "@/features/purchases/types/purchase.types";
import { Truck, CheckCircle, Calendar, FileText, Send } from "lucide-react";

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: PurchaseOrder | null;
  onOrder: (id: string) => Promise<unknown>;
  onReceive: (purchase: PurchaseOrder) => Promise<unknown>;
  isSubmitting: boolean;
}

export const PurchaseDetailModal = ({
  isOpen,
  onClose,
  purchase,
  onOrder,
  onReceive,
  isSubmitting,
}: PurchaseDetailModalProps) => {
  if (!purchase) return null;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  const isReceived = ["PENDING_PAYMENT", "PAID", "RECEIVED"].includes(purchase.status);
  const canReceive = !isReceived && purchase.status !== "CANCELLED";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Orden de Compra ${purchase.number}`}
      description={`Proveedor: ${purchase.supplierName}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Status bar card */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Estado de la Orden</p>
              <div className="mt-0.5">
                {isReceived ? (
                  <Badge variant="success">Recepcionado en Almacén</Badge>
                ) : (
                  <Badge variant="warning">Pendiente de Ingreso</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {purchase.status === "DRAFT" && <Button onClick={() => void onOrder(purchase.id)} disabled={isSubmitting} variant="ghost" className="gap-2 border border-slate-200"><Send className="h-4 w-4" />Ordenar</Button>}
            {canReceive && <Button onClick={() => void onReceive(purchase)} disabled={isSubmitting || purchase.status === "DRAFT"} className="gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"><CheckCircle className="h-4 w-4" />{isSubmitting ? "Procesando..." : "Recepcionar"}</Button>}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-600" /> Ítems Solicitados
          </div>

          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/40 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5">SKU / Producto</th>
                <th className="px-4 py-2.5 text-right">Cantidad</th>
                <th className="px-4 py-2.5 text-right">Costo Unit. (S/)</th>
                <th className="px-4 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchase.items?.map((item) => (
                <tr key={item.id || item.productId}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-400 font-semibold mr-1.5">{item.sku}</span>
                    <span className="font-medium text-slate-900">{item.productName}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right">{formatPrice(item.unitCost)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatPrice(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 border-t border-slate-200">
            <span>Total Orden de Compra:</span>
            <span className="text-base text-blue-700">{formatPrice(purchase.total)}</span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Fecha de emisión:{" "}
            {new Date(purchase.createdAt).toLocaleDateString("es-PE")}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
