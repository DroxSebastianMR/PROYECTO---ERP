import { Building2, TrendingUp, UserCheck, Users, UserX } from "lucide-react";
import type { CustomerMetrics } from "@/features/customers/types/customer.types";

interface CustomerMetricsProps {
  metrics: CustomerMetrics;
}

export const CustomerMetricsView = ({ metrics }: CustomerMetricsProps) => {
  const formatPrice = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Clientes */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)] transition duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Clientes
            </p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {metrics.totalCustomers}
            </h3>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <Building2 className="h-3.5 w-3.5 text-blue-600" /> {metrics.empresaCount} Empresas
          </span>
          <span className="text-slate-300">•</span>
          <span>{metrics.naturalCount} Pers. Naturales</span>
        </div>
      </div>

      {/* Clientes Activos */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)] transition duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clientes Activos
            </p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">
              {metrics.activeCustomers}
            </h3>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {metrics.totalCustomers > 0
            ? `${Math.round((metrics.activeCustomers / metrics.totalCustomers) * 100)}% del catálogo con disponibilidad activa.`
            : "Sin clientes registrados"}
        </div>
      </div>

      {/* Inactivos / Bloqueados */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)] transition duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Inactivos / Bloqueados
            </p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
              {metrics.inactiveCustomers + metrics.blockedCustomers}
            </h3>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <UserX className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-slate-600">{metrics.inactiveCustomers} Inactivos</span>
          <span className="text-slate-300">•</span>
          <span className="font-semibold text-rose-600">{metrics.blockedCustomers} Bloqueados</span>
        </div>
      </div>

      {/* Ventas Acumuladas */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)] transition duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ventas Acumuladas
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-blue-700 sm:text-2xl">
              {formatPrice(metrics.totalRevenue)}
            </h3>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Facturación histórica total de clientes registrados
        </div>
      </div>
    </div>
  );
};
