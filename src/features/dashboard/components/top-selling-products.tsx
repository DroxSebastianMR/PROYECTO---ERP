import { PackageOpen } from "lucide-react";
import type { DashboardPeriod, TopSellingProduct } from "@/features/dashboard/types/dashboard.types";

type TopSellingProductsProps = {
  products: TopSellingProduct[];
  period: DashboardPeriod;
  month: number;
  isLoading?: boolean;
  onPeriodChange: (year: DashboardPeriod) => void;
  onMonthChange: (month: number) => void;
};

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const TopSellingProducts = ({ products, period, month, onPeriodChange, onMonthChange, isLoading = false }: TopSellingProductsProps) => (
  <article className="h-full min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(37,99,235,.035)] sm:p-6">
    <div className="flex flex-col gap-3">
      <div><h2 className="text-lg font-semibold">Productos más vendidos</h2><p className="mt-0.5 text-xs text-slate-500">Unidades vendidas en el periodo seleccionado.</p></div>
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Mes" value={month} onChange={(event) => onMonthChange(Number(event.target.value))} className="min-w-0 rounded-lg bg-slate-100 px-2.5 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100">{months.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select>
        <select aria-label="Año" value={period} onChange={(event) => onPeriodChange(event.target.value as DashboardPeriod)} className="min-w-0 rounded-lg bg-slate-100 px-2.5 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100">{[String(new Date().getFullYear()), String(new Date().getFullYear() - 1), String(new Date().getFullYear() - 2)].map((year) => <option key={year} value={year}>{year}</option>)}</select>
      </div>
    </div>
    <div className={`mt-4 space-y-2 transition-opacity ${isLoading ? "opacity-55" : "opacity-100"}`} aria-busy={isLoading}>
      {products.map((product, index) => <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span>{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-slate-100 object-contain bg-white" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-400"><PackageOpen className="h-5 w-5" /></span>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{product.name}</p><p className="mt-0.5 font-mono text-[11px] text-slate-500">{product.sku}</p></div><div className="shrink-0 text-right"><p className="text-sm font-bold text-blue-700">{product.quantity} {product.unit}</p><p className="text-[10px] text-slate-500">vendidas</p></div></div>)}
      {!products.length && <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-sm text-slate-500">No hay productos vendidos en este periodo.</div>}
    </div>
  </article>
);
