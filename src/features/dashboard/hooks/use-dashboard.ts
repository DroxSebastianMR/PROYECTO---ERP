import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import type { DashboardPeriod } from "@/features/dashboard/types/dashboard.types";
import { useAuth } from "@/features/auth/hooks/use-auth";

export const useDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>(String(new Date().getFullYear()));
  const [topProductsPeriod, setTopProductsPeriod] = useState<DashboardPeriod>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showAllSales, setShowAllSales] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  // Scope cached data to the company so a different session never sees a prior company's dashboard.
  const companyId = user?.companyId ?? "anonymous";
  const overviewQuery = useQuery({ queryKey: ["dashboard", companyId, "overview", period], queryFn: () => dashboardService.getOverview(period), placeholderData: keepPreviousData, staleTime: 30_000, enabled: Boolean(user) });
  const topProductsQuery = useQuery({ queryKey: ["dashboard", companyId, "top-products", topProductsPeriod, selectedMonth], queryFn: () => dashboardService.getTopProducts(topProductsPeriod, selectedMonth), placeholderData: keepPreviousData, staleTime: 30_000, enabled: Boolean(user) });

  const changePeriod = useCallback((nextPeriod: DashboardPeriod) => {
    setPeriod(nextPeriod);
    setShowAllSales(false);
  }, []);

  return useMemo(() => ({
    data: overviewQuery.data ?? null,
    topProducts: topProductsQuery.data ?? [],
    period,
    setPeriod: changePeriod,
    topProductsPeriod,
    setTopProductsPeriod,
    selectedMonth,
    setSelectedMonth,
    isLoading: overviewQuery.isLoading,
    isRefreshing: overviewQuery.isFetching && !overviewQuery.isLoading,
    isTopProductsLoading: topProductsQuery.isFetching,
    refresh: () => overviewQuery.refetch(),
    showAllSales,
    toggleSales: () => setShowAllSales((value) => !value),
    showAllActivity,
    toggleActivity: () => setShowAllActivity((value) => !value),
  }), [overviewQuery.data, overviewQuery.isLoading, overviewQuery.isFetching, topProductsQuery.data, topProductsQuery.isFetching, period, topProductsPeriod, selectedMonth, changePeriod, showAllSales, showAllActivity]);
};
