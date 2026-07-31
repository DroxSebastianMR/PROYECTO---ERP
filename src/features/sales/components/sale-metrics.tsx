import { Tag, Receipt, TrendingUp, CheckCircle2 } from "lucide-react";
import type { SaleMetrics as SMetrics } from "@/features/sales/types/sale.types";

interface SaleMetricsProps {
  metrics: SMetrics;
}

export const SaleMetrics = ({ metrics }: SaleMetricsProps) => {
  const formattedTotal = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(metrics.todayTotalSales);

  const formattedAvg = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(metrics.averageTicket);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Metric 1: Ventas Acumuladas */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Ventas Totales
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{formattedTotal}</p>
          <p className="mt-1 text-xs font-medium text-emerald-600">Facturado y cobrado</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <Tag className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 2: Comprobantes Emitidos */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Comprobantes
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.vouchersIssuedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Boletas y facturas</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-purple-50 text-purple-600">
          <Receipt className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 3: Ticket Promedio */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Ticket Promedio
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{formattedAvg}</p>
          <p className="mt-1 text-xs text-slate-500">Monto medio por venta</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-50 text-amber-600">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 4: Tasa de Cobro */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Efectividad Cobros
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
            {metrics.paidPercentage}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Ventas liquidadas al contado</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
