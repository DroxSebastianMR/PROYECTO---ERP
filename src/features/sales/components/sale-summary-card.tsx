import { CalendarDays, CreditCard, ReceiptText, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { SaleReceipt } from "@/features/sales/types/sale.types";

interface SaleSummaryCardProps {
  sale: SaleReceipt;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

const paymentLabels: Record<SaleReceipt["paymentMethod"], string> = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  YAPE_PLIN: "Yape / Plin",
  CREDIT: "Crédito",
};

const statusLabel = (status: SaleReceipt["status"]) => {
  if (status === "PAID") return <Badge variant="success">Vendido · Pagado</Badge>;
  if (status === "PENDING_PAYMENT" || status === "PARTIALLY_PAID") return <Badge variant="warning">Pendiente de pago</Badge>;
  if (status === "CANCELLED") return <Badge variant="destructive">Anulada</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
};

export const SaleSummaryCard = ({ sale }: SaleSummaryCardProps) => (
  <div className="space-y-5">
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-700 text-white shadow-sm">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Comprobante de venta</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-900">{sale.number}</p>
          </div>
        </div>
        {statusLabel(sale.status)}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryField icon={<UserRound />} label="Cliente" value={sale.customerName} detail={sale.customerDocument || "Sin documento"} />
        <SummaryField icon={<CreditCard />} label="Método de pago" value={paymentLabels[sale.paymentMethod]} detail={sale.documentType === "INVOICE" ? "Factura manual" : "Ticket de venta"} />
        <SummaryField icon={<CalendarDays />} label="Fecha de emisión" value={new Date(sale.createdAt).toLocaleDateString("es-PE")} detail={new Date(sale.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} />
      </div>
    </section>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Productos vendidos</h4>
          <p className="mt-0.5 text-xs text-slate-500">{sale.items.length} producto(s) registrados en esta venta.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{sale.items.length} ítems</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-3 py-3 text-center font-semibold">Cant.</th>
              <th className="px-3 py-3 text-right font-semibold">P. unit.</th>
              <th className="px-4 py-3 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.items.map((item) => (
              <tr key={item.id || item.productId} className="hover:bg-slate-50/70">
                <td className="px-4 py-3"><p className="font-semibold text-slate-800">{item.productName}</p><p className="mt-0.5 font-mono text-xs text-slate-400">{item.sku}</p></td>
                <td className="px-3 py-3 text-center font-semibold text-slate-700">{item.quantity}</td>
                <td className="px-3 py-3 text-right text-slate-600">{money(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">{money(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <section className="ml-auto w-full max-w-sm rounded-xl border border-blue-100 bg-blue-50/60 p-4">
      <SummaryTotal label="Subtotal" value={sale.subtotalAmount} />
      <SummaryTotal label="IGV (18%)" value={sale.igvAmount} />
      <div className="my-3 border-t border-blue-200" />
      <div className="flex items-end justify-between"><span className="font-bold text-slate-800">Total cobrado</span><span className="text-2xl font-bold tracking-tight text-blue-700">{money(sale.total)}</span></div>
    </section>
  </div>
);

const SummaryField = ({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) => (
  <div className="flex min-w-0 gap-2.5 rounded-xl bg-white/80 p-3 ring-1 ring-slate-100">
    <span className="mt-0.5 text-blue-600">{icon}</span>
    <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="truncate text-sm font-semibold text-slate-800">{value}</p><p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p></div>
  </div>
);

const SummaryTotal = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between text-sm text-slate-600"><span>{label}</span><span className="font-semibold text-slate-800">{money(value)}</span></div>
);
