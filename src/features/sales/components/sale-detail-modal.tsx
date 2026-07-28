import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SaleReceipt } from "@/features/sales/types/sale.types";
import { Printer, Archive, CheckCircle } from "lucide-react";

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleReceipt | null;
  onConfirm: (id: string) => Promise<unknown>;
  isSubmitting: boolean;
}

export const SaleDetailModal = ({
  isOpen,
  onClose,
  sale,
  onConfirm,
  isSubmitting,
}: SaleDetailModalProps) => {
  if (!sale) return null;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprobante Electrónico ${sale.number}`}
      description="Vista oficial de venta e impresión de ticket / factura."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Printable Ticket Container */}
        <div
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 font-sans shadow-sm"
          id="printable-receipt"
        >
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 font-bold text-white">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-blue-700">DistriCorp S.A.C.</p>
                <p className="text-xs text-slate-500">RUC: 20609988771 • Av. Principal 123</p>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-right">
              <p className="text-xs font-bold uppercase text-blue-800">Boleta de Venta</p>
              <p className="font-mono text-sm font-bold text-blue-900">{sale.number}</p>
            </div>
          </div>

          {/* Client metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold uppercase text-slate-400">Cliente</p>
              <p className="mt-0.5 font-bold text-slate-900">{sale.customerName}</p>
              <p className="text-slate-500">{sale.customerDocument || "S/D"}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold uppercase text-slate-400">Fecha & Hora</p>
              <p className="mt-0.5 font-medium text-slate-800">
                {new Date(sale.createdAt).toLocaleString("es-PE")}
              </p>
              <p className="text-slate-500">Pago: {sale.paymentMethod}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full divide-y divide-slate-100 border-y border-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Cant.</th>
                <th className="px-2 py-2">Descripción</th>
                <th className="px-2 py-2 text-right">P. Unit</th>
                <th className="px-2 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items?.map((item) => (
                <tr key={item.id || item.productId}>
                  <td className="px-2 py-2 font-bold">{item.quantity}</td>
                  <td className="px-2 py-2 font-medium text-slate-800">{item.productName}</td>
                  <td className="px-2 py-2 text-right">{formatPrice(item.unitPrice)}</td>
                  <td className="px-2 py-2 text-right font-bold">{formatPrice(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown */}
          <div className="space-y-1 pt-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Op. Gravada:</span>
              <span>{formatPrice(sale.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV (18%):</span>
              <span>{formatPrice(sale.igvAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>IMPORTE TOTAL:</span>
              <span className="text-blue-700">{formatPrice(sale.total)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            onClick={handlePrint}
            variant="ghost"
            className="gap-2 border border-slate-200 text-slate-700"
          >
            <Printer className="h-4 w-4" />
            Imprimir Comprobante
          </Button>
          <div className="flex gap-2">
            {sale.status === "DRAFT" && (
              <Button
                onClick={() => void onConfirm(sale.id)}
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4" />
                Vender y cobrar
              </Button>
            )}
            <Button variant="default" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
