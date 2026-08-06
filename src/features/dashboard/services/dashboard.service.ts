import { httpClient } from "@/lib/api/http-client";
import type { DashboardData, DashboardPeriod } from "@/features/dashboard/types/dashboard.types";

export const dashboardService = {
  getOverview: (period: DashboardPeriod) => httpClient<DashboardData>(`/dashboard/overview?year=${encodeURIComponent(period)}`),
};
