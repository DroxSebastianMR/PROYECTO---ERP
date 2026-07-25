import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import type { DashboardData, DashboardPeriod } from "@/features/dashboard/types/dashboard.types";

export const useDashboard = () => {
  const [period, setPeriod] = useState<DashboardPeriod>("2024");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllSales, setShowAllSales] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const load = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        setData(await dashboardService.getOverview(period));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [period],
  );

  useEffect(() => {
    const request = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(request);
  }, [load]);

  const changePeriod = useCallback((nextPeriod: DashboardPeriod) => {
    setPeriod(nextPeriod);
    setShowAllSales(false);
  }, []);

  return useMemo(
    () => ({
      data,
      period,
      setPeriod: changePeriod,
      isLoading,
      isRefreshing,
      refresh: () => load(true),
      showAllSales,
      toggleSales: () => setShowAllSales((value) => !value),
      showAllActivity,
      toggleActivity: () => setShowAllActivity((value) => !value),
    }),
    [data, period, isLoading, isRefreshing, load, showAllSales, showAllActivity, changePeriod],
  );
};
