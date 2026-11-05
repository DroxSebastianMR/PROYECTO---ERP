import { WalletCards, Boxes, ArrowUpDown, AlertTriangle } from "lucide-react";
import type { InventoryMetrics as IMetrics } from "@/features/inventory/types/inventory.types";

interface InventoryMetricsProps {
  metrics: IMetrics;
}

export const InventoryMetrics = ({ metrics }: InventoryMetricsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {/* Metric 1: Total Existencias */}
      <div className="flex min-w-0 items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(37,99,235,.03)] sm:items-center sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Existencias
          </p>
          <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {metrics.totalUnits.toLocaleString("es-PE")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Unidades físicas en almacén</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 sm:h-11 sm:w-11">
          <Boxes className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 2: Valor de inventario */}
      <div className="flex min-w-0 items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(37,99,235,.03)] sm:items-center sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Valor de inventario
          </p>
          <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(metrics.inventoryValue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Valorizado al costo referencial</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 sm:h-11 sm:w-11">
          <WalletCards className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 3: Movimientos Kardex */}
      <div className="flex min-w-0 items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(37,99,235,.03)] sm:items-center sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Movimientos Kardex
          </p>
          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {metrics.todayMovementsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Entradas, salidas y ajustes</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-purple-50 text-purple-600 sm:h-11 sm:w-11">
          <ArrowUpDown className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 4: Stock Crítico */}
      <div
        className={`flex min-w-0 items-start justify-between gap-2 rounded-xl border p-3 shadow-[0_8px_20px_rgba(37,99,235,.03)] sm:items-center sm:p-5 ${
          metrics.lowStockItemsCount > 0
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Alertas de Stock
          </p>
          <p
            className={`mt-2 text-xl font-bold tracking-tight sm:text-2xl ${
              metrics.lowStockItemsCount > 0 ? "text-amber-600" : "text-slate-900"
            }`}
          >
            {metrics.lowStockItemsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Bajo el límite mínimo</p>
        </div>
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 ${
            metrics.lowStockItemsCount > 0
              ? "bg-amber-100 text-amber-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
