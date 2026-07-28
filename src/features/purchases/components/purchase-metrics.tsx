import { ShoppingCart, Clock, CheckCircle2, Truck } from "lucide-react";
import type { PurchaseMetrics as PMetrics } from "@/features/purchases/types/purchase.types";

interface PurchaseMetricsProps {
  metrics: PMetrics;
}

export const PurchaseMetrics = ({ metrics }: PurchaseMetricsProps) => {
  const formattedTotal = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(metrics.totalMonthPurchases);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Metric 1: Compras Recepcionadas (S/) */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Compras Mes
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {formattedTotal}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Ingresadas a almacén</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <ShoppingCart className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 2: Órdenes Pendientes */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pendientes de Ingreso
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">
            {metrics.pendingOrdersCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">En tránsito o borrador</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-50 text-amber-600">
          <Clock className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 3: Órdenes Completadas */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Completadas
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.receivedOrdersCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Stock cargado a almacén</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>

      {/* Metric 4: Proveedores */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Proveedores Activos
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metrics.suppliersCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Empresas suministradoras</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-purple-50 text-purple-600">
          <Truck className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
