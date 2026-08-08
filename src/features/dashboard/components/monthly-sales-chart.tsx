import type { DashboardPeriod, SalesPoint } from "@/features/dashboard/types/dashboard.types";

type MonthlySalesChartProps = {
  data: SalesPoint[];
  period: DashboardPeriod;
  selectedMonth: number;
  onPeriodChange: (period: DashboardPeriod) => void;
  onMonthSelect: (month: number) => void;
};

const money = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
const compactMoney = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", notation: "compact", maximumFractionDigits: 1 }).format(value);

export const MonthlySalesChart = ({ data, period, selectedMonth, onPeriodChange, onMonthSelect }: MonthlySalesChartProps) => {
  const selectedPoint = data[selectedMonth - 1];
  const maximum = Math.max(...data.map((point) => point.amount), 1);

  return (
    <article className="min-w-0 self-start rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(37,99,235,.035)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ventas mensuales</h2>
          <p className="mt-0.5 text-xs text-slate-500">Selecciona un mes para consultar su cantidad de ventas.</p>
        </div>
        <select value={period} onChange={(event) => onPeriodChange(event.target.value as DashboardPeriod)} className="w-full cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto">
          {[String(new Date().getFullYear()), String(new Date().getFullYear() - 1), String(new Date().getFullYear() - 2)].map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>
      <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/60">
        <div className="border-r border-blue-100 px-3 py-2.5 sm:px-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Periodo</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{selectedPoint?.month ?? "Mes"} {period}</p></div>
        <div className="border-r border-blue-100 px-3 py-2.5 sm:px-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Cantidad</p><p className="mt-0.5 text-sm font-bold text-blue-700">{selectedPoint?.salesCount ?? 0} ventas</p></div>
        <div className="px-3 py-2.5 text-right sm:px-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Vendido</p><p className="mt-0.5 text-sm font-bold text-blue-700">{money(selectedPoint?.amount ?? 0)}</p></div>
      </div>
      <div className="mt-6 flex h-[205px] min-w-0 sm:h-[235px]">
        <div className="flex w-11 shrink-0 flex-col justify-between pb-8 pr-2 text-right text-[10px] text-slate-500 sm:w-14 sm:text-[11px]"><span>{compactMoney(maximum)}</span><span>{compactMoney(maximum / 2)}</span><span>S/ 0</span></div>
        <div className="relative min-w-0 flex-1 border-b border-l border-slate-200">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between"><span className="border-t border-dashed border-slate-200" /><span className="border-t border-dashed border-slate-200" /><span className="border-t border-dashed border-slate-200" /></div>
          <div className="relative flex h-full items-end gap-1 px-2 sm:gap-2 sm:px-4">
          {data.map(({ amount, month, salesCount }, index) => {
            const isSelected = index + 1 === selectedMonth;
            const height = Math.max(amount ? 7 : 2, Math.min(100, (amount / maximum) * 100));
            return <button type="button" key={month} title={`${month}: ${salesCount} ventas · ${money(amount)}`} onClick={() => onMonthSelect(index + 1)} className="group flex h-full flex-1 flex-col justify-end outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={`${month}: ${salesCount} ventas por ${money(amount)}`} aria-pressed={isSelected}>
              <span className={`mb-1 hidden whitespace-nowrap text-center text-[10px] font-semibold sm:block ${isSelected ? "text-blue-700" : "text-slate-400 group-hover:text-blue-600"}`}>{amount ? compactMoney(amount) : ""}</span>
              <div className={`w-full rounded-t-md transition-all duration-200 ${isSelected ? "bg-blue-700 shadow-[0_0_0_2px_rgba(37,99,235,.12)]" : amount === 0 ? "bg-slate-200 group-hover:bg-slate-300" : "bg-blue-300 group-hover:bg-blue-500"}`} style={{ height: `${height}%` }} />
              <span className={`mt-2 h-5 text-center text-[9px] sm:mt-3 sm:text-[11px] ${isSelected ? "font-bold text-blue-700" : "text-slate-500"}`}>{month}</span>
            </button>;
          })}
          </div>
        </div>
      </div>
    </article>
  );
};
