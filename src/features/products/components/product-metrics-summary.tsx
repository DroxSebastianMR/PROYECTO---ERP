import { AlertTriangle, Boxes, DollarSign, Layers } from "lucide-react";
import type { ProductMetrics } from "@/features/products/types/product.types";

interface ProductMetricsSummaryProps {
  metrics: ProductMetrics;
}

export const ProductMetricsSummary = ({ metrics }: ProductMetricsSummaryProps) => {
  const formattedValue = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(metrics.totalInventoryValue);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Metric 1: Total Productos */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Productos
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.totalProducts}
          </p>
          <p className="mt-1 text-xs text-slate-500">Registrados en catálogo</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <Boxes className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 2: Valor Estimado Inventario */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Valor Inventario
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {formattedValue}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">A precio de venta</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <DollarSign className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 3: Categorías */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categorías</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.totalCategories}
          </p>
          <p className="mt-1 text-xs text-slate-500">Familias activas</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-700">
          <Layers className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 4: Alertas de Stock */}
      <div
        className={`flex items-center justify-between rounded-xl border p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)] ${
          metrics.lowStockAlerts > 0
            ? "border-red-200 bg-red-50/30"
            : "border-slate-200 bg-white"
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stock Crítico</p>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight ${
              metrics.lowStockAlerts > 0 ? "text-red-600" : "text-slate-900"
            }`}
          >
            {metrics.lowStockAlerts}
          </p>
          <p className="mt-1 text-xs text-slate-500">Bajo el stock mínimo</p>
        </div>
        <div
          className={`grid h-11 w-11 place-items-center rounded-lg ${
            metrics.lowStockAlerts > 0
              ? "bg-red-100 text-red-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
