import { AlertTriangle, Boxes, CreditCard, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { MonthlySalesChart } from "@/features/dashboard/components/monthly-sales-chart";
import { TopSellingProducts } from "@/features/dashboard/components/top-selling-products";
import { RecentSales } from "@/features/dashboard/components/recent-sales";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

const money = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

export const DashboardPage = () => {
  const dashboard = useDashboard();
  const navigate = useNavigate();
  const { user } = useAuth();
  if (dashboard.isLoading || !dashboard.data) return <DashboardSkeleton />;
  const { data } = dashboard;
  return <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
    <header><h1 className="text-2xl font-bold tracking-[-.045em] sm:text-[30px]">Dashboard</h1><p className="mt-1 text-[15px] text-slate-700">Bienvenido nuevamente, {user?.fullName ?? "usuario"}.</p></header>
    <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <MetricCard title="Ventas del día" value={money(data.metrics.todaySales)} Icon={Store} />
      <MetricCard title="Ventas del mes" value={money(data.metrics.monthIncome)} Icon={CreditCard} />
      <MetricCard title="Valor del stock" value={money(data.metrics.stockValue)} Icon={Boxes} />
      <MetricCard title="Prod. registrados" value={String(data.metrics.products)} Icon={Boxes} />
      <MetricCard title="Stock bajo" value={String(data.metrics.lowStock)} Icon={AlertTriangle} alert />
    </section>
    <section className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <MonthlySalesChart data={data.sales} period={dashboard.period} selectedMonth={dashboard.selectedMonth} onPeriodChange={dashboard.setPeriod} onMonthSelect={dashboard.setSelectedMonth} />
      <TopSellingProducts products={dashboard.topProducts} period={dashboard.topProductsPeriod} month={dashboard.selectedMonth} onPeriodChange={dashboard.setTopProductsPeriod} onMonthChange={dashboard.setSelectedMonth} isLoading={dashboard.isTopProductsLoading} />
      <div className="min-w-0 lg:col-start-1">
        <RecentSales sales={data.recentSales} showAll={dashboard.showAllSales} onToggle={dashboard.toggleSales} />
        <section className="mt-5 overflow-hidden rounded-xl border border-red-100 bg-white shadow-[0_8px_20px_rgba(37,99,235,.03)]">
          <header className="flex items-center gap-3 bg-red-50/70 px-4 py-4 sm:px-5"><AlertTriangle className="h-4 w-4 text-red-600" /><h2 className="text-base font-semibold">Alertas de stock</h2></header>
          {data.stockAlerts.length ? data.stockAlerts.map((stock) => <button key={stock.id} onClick={() => navigate(PATHS.APP.INVENTORY)} className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:gap-4 sm:px-5"><div className="grid h-10 w-10 place-items-center rounded bg-slate-200"><Boxes className="h-[18px] w-[18px] text-slate-600" /></div><div className="min-w-0"><p className="truncate text-sm font-medium">{stock.product}</p><p className="text-xs text-slate-600">SKU: {stock.sku} · {stock.warehouse}</p></div><div className="ml-auto text-right"><p className="text-sm font-semibold text-red-700">{stock.quantity} {stock.unit}</p><p className="text-xs text-slate-600">Mín: {stock.minimum}</p></div></button>) : <p className="px-5 py-8 text-sm text-slate-500">No hay alertas de stock.</p>}
        </section>
      </div>
      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-2"><ActivityFeed activities={data.activities} showAll={dashboard.showAllActivity} onToggle={dashboard.toggleActivity} /></div>
    </section>
  </div>;
};
