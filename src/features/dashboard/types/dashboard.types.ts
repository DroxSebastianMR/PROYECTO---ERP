export type DashboardPeriod = "2024" | "2025";

export type SalesPoint = { month: string; amount: number };
export type PaymentMethod = { name: string; percentage: number; color: string };
export type SaleStatus = "Pagado" | "Pendiente" | "Anulado";
export type RecentSale = {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: SaleStatus;
};
export type ActivityKind = "client" | "purchase" | "alert" | "report";
export type Activity = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  timestamp: string;
};
export type StockAlert = {
  id: string;
  product: string;
  sku: string;
  warehouse: string;
  quantity: string;
  minimum: string;
};
export type DashboardData = {
  sales: SalesPoint[];
  paymentMethods: PaymentMethod[];
  recentSales: RecentSale[];
  activities: Activity[];
  stockAlerts: StockAlert[];
};
