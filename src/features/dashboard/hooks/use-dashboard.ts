import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import type { DashboardPeriod } from "@/features/dashboard/types/dashboard.types";

export const useDashboard = () => {
  const [period, setPeriod] = useState<DashboardPeriod>(String(new Date().getFullYear()));
  const [topProductsPeriod, setTopProductsPeriod] = useState<DashboardPeriod>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showAllSales, setShowAllSales] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const overviewQuery = useQuery({ queryKey: ["dashboard", "overview", period], queryFn: () => dashboardService.getOverview(period), placeholderData: keepPreviousData, staleTime: 30_000 });
  const topProductsQuery = useQuery({ queryKey: ["dashboard", "top-products", topProductsPeriod, selectedMonth], queryFn: () => dashboardService.getTopProducts(topProductsPeriod, selectedMonth), placeholderData: keepPreviousData, staleTime: 30_000 });

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
