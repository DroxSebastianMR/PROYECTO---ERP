export type DashboardPeriod = string;
export type SalesPoint = { month: string; amount: number; salesCount: number };
export type TopSellingProduct = { id: string; name: string; sku: string; imageUrl: string | null; unit: string; quantity: number; lines: number };
export type SaleStatus = "Pagado" | "Pendiente" | "Anulado";
export type RecentSale = { id: string; customer: string; date: string; amount: number; status: SaleStatus };
export type ActivityKind = "client" | "purchase" | "alert" | "report";
export type Activity = { id: string; kind: ActivityKind; title: string; detail: string; timestamp: string };
export type StockAlert = { id: string; product: string; sku: string; warehouse: string; quantity: number; minimum: number; unit: string };
export type DashboardData = {
  metrics: {
    todaySales: number;
    stockPurchaseValue: number;
    stockSalesValue: number;
    stockMargin: number;
    lowStock: number;
  };
  sales: SalesPoint[];
  recentSales: RecentSale[];
  activities: Activity[];
  stockAlerts: StockAlert[];
};
