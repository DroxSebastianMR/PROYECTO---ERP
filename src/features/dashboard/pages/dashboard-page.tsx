import {
  AlertTriangle,
  Boxes,
  CreditCard,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { MonthlySalesChart } from "@/features/dashboard/components/monthly-sales-chart";
import { PaymentMethods } from "@/features/dashboard/components/payment-methods";
import { RecentSales } from "@/features/dashboard/components/recent-sales";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

export const DashboardPage = () => {
  const dashboard = useDashboard();
  if (dashboard.isLoading || !dashboard.data)
    return <div className="p-4 text-sm text-slate-500 sm:p-6 lg:p-7">Cargando dashboard...</div>;
  const { data } = dashboard;
  return (
    <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-7">
      <header>
        <div>
          <h1 className="text-2xl font-bold tracking-[-.045em] sm:text-[30px]">Dashboard</h1>
          <p className="mt-1 text-[15px] text-slate-700">Bienvenido nuevamente, Administrador.</p>
        </div>
      </header>
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Ventas del día" value="S/ 8,540" trend="+12%" Icon={Store} />
        <MetricCard title="Compras del mes" value="S/ 41,280" trend="+4%" Icon={ShoppingCart} />
        <MetricCard title="Prod. registrados" value="1,285" Icon={Boxes} />
        <MetricCard title="Clientes registrados" value="532" trend="+8%" Icon={Users} />
        <MetricCard title="Ingresos del mes" value="S/ 164,850" trend="+15%" Icon={CreditCard} />
        <MetricCard title="Stock Bajo" value="18" Icon={AlertTriangle} alert />
      </section>
      <section className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <MonthlySalesChart
          data={data.sales}
          period={dashboard.period}
          onPeriodChange={dashboard.setPeriod}
        />
        <PaymentMethods methods={data.paymentMethods} />
        <div className="min-w-0 lg:col-start-1">
          <RecentSales
            sales={data.recentSales}
            showAll={dashboard.showAllSales}
            onToggle={dashboard.toggleSales}
          />
          <section className="mt-5 overflow-hidden rounded-xl border border-red-100 bg-white shadow-[0_8px_20px_rgba(37,99,235,.03)]">
            <header className="flex items-center gap-3 bg-red-50/70 px-4 py-4 sm:px-5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h2 className="text-base font-semibold">Alertas de Stock</h2>
            </header>
            {data.stockAlerts.map((stock) => (
              <button
                key={stock.id}
                className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:gap-4 sm:px-5"
              >
                <div className="grid h-10 w-10 place-items-center rounded bg-slate-200">
                  <Boxes className="h-[18px] w-[18px] text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{stock.product}</p>
                  <p className="text-xs text-slate-600">
                    SKU: {stock.sku} • {stock.warehouse}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-semibold text-red-700">{stock.quantity}</p>
                  <p className="text-xs text-slate-600">{stock.minimum}</p>
                </div>
              </button>
            ))}
          </section>
        </div>
        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-2">
          <ActivityFeed
            activities={data.activities}
            showAll={dashboard.showAllActivity}
            onToggle={dashboard.toggleActivity}
          />
        </div>
      </section>
    </div>
  );
};
