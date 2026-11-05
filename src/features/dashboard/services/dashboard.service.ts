import { httpClient } from "@/lib/api/http-client";
import type { DashboardData, DashboardPeriod, TopSellingProduct } from "@/features/dashboard/types/dashboard.types";

export const dashboardService = {
  getOverview: (period: DashboardPeriod) => httpClient<DashboardData>(`/dashboard/overview?year=${encodeURIComponent(period)}`),
  getTopProducts: (period: DashboardPeriod, month: number) => httpClient<TopSellingProduct[]>(`/dashboard/top-products?year=${encodeURIComponent(period)}&month=${encodeURIComponent(month)}`),
};
