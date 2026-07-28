import { Warehouse, Boxes, ArrowUpDown, AlertTriangle } from "lucide-react";
import type { InventoryMetrics as IMetrics } from "@/features/inventory/types/inventory.types";

interface InventoryMetricsProps {
  metrics: IMetrics;
}

export const InventoryMetrics = ({ metrics }: InventoryMetricsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Metric 1: Total Existencias */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Existencias
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.totalUnits.toLocaleString("es-PE")}
          </p>
          <p className="mt-1 text-xs text-slate-500">Unidades físicas en almacén</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <Boxes className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 2: Almacenes Activos */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Almacenes Activos
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.activeWarehouses}
          </p>
          <p className="mt-1 text-xs text-slate-500">Sedes de custodia</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <Warehouse className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 3: Movimientos Kardex */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Movimientos Kardex
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.todayMovementsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Entradas, salidas y ajustes</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-purple-50 text-purple-600">
          <ArrowUpDown className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 4: Stock Crítico */}
      <div
        className={`flex items-center justify-between rounded-xl border p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)] ${
          metrics.lowStockItemsCount > 0 ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Alertas de Stock
          </p>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight ${
              metrics.lowStockItemsCount > 0 ? "text-amber-600" : "text-slate-900"
            }`}
          >
            {metrics.lowStockItemsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Bajo el límite mínimo</p>
        </div>
        <div
          className={`grid h-11 w-11 place-items-center rounded-lg ${
            metrics.lowStockItemsCount > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
