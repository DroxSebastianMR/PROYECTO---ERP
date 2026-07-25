import type { DashboardPeriod, SalesPoint } from "@/features/dashboard/types/dashboard.types";

type MonthlySalesChartProps = {
  data: SalesPoint[];
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
};
export const MonthlySalesChart = ({ data, period, onPeriodChange }: MonthlySalesChartProps) => (
  <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_10px_24px_rgba(37,99,235,.035)]">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Ventas Mensuales</h2>
      <select
        value={period}
        onChange={(event) => onPeriodChange(event.target.value as DashboardPeriod)}
        className="cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>
    </div>
    <div className="mt-7 flex h-[305px]">
      <div className="flex w-8 flex-col justify-between pb-8 text-[11px] text-slate-500">
        <span>150k</span>
        <span>100k</span>
        <span>50k</span>
        <span>0</span>
      </div>
      <div className="flex flex-1 items-end gap-2 border-b border-l border-slate-200 px-4">
        {data.map(({ amount, month }, index) => (
          <button
            type="button"
            key={month}
            title={`${month}: S/ ${amount}k`}
            className="flex h-full flex-1 flex-col justify-end outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Ventas de ${month}: S/ ${amount} mil`}
          >
            <div
              className={`w-full rounded-t-sm transition-opacity hover:opacity-75 ${index === 5 ? "bg-blue-700" : amount === 0 ? "bg-slate-100" : "bg-blue-500/75"}`}
              style={{ height: `${amount}%` }}
            />
            <span className="mt-3 text-center text-[11px] text-slate-500">{month}</span>
          </button>
        ))}
      </div>
    </div>
  </article>
);
