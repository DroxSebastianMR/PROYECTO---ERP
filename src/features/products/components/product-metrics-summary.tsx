import { Boxes, CheckCircle2, Layers, PauseCircle } from "lucide-react";
import type { ProductMetrics } from "@/features/products/types/product.types";

interface ProductMetricsSummaryProps {
  metrics: ProductMetrics;
}

const MetricCard = ({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Boxes;
  tone: "blue" | "emerald" | "slate" | "amber";
}) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(37,99,235,.03)]">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <div className={`grid h-11 w-11 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
};

export const ProductMetricsSummary = ({ metrics }: ProductMetricsSummaryProps) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <MetricCard label="Total de productos" value={metrics.totalProducts} description="Según los filtros aplicados" icon={Boxes} tone="blue" />
    <MetricCard label="Categorías" value={metrics.totalCategories} description="Categorías visibles" icon={Layers} tone="slate" />
    <MetricCard label="Productos activos" value={metrics.activeProducts} description="Disponibles para operar" icon={CheckCircle2} tone="emerald" />
    <MetricCard label="Productos inactivos" value={metrics.inactiveProducts} description="Fuera de operaciones" icon={PauseCircle} tone="amber" />
  </div>
);
