import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { WarehouseStockItem } from "@/features/inventory/types/inventory.types";

const STOCKS_QUERY_KEY = ["inventory", "stocks"] as const;
const MOVEMENTS_QUERY_KEY = ["inventory", "movements"] as const;
const EMPTY_STOCKS: WarehouseStockItem[] = [];
const EMPTY_MOVEMENTS: Awaited<ReturnType<typeof inventoryService.getMovements>> = [];

export const useInventory = () => {
  const queryClient = useQueryClient();
  const stocksQuery = useQuery({ queryKey: STOCKS_QUERY_KEY, queryFn: inventoryService.getStocks, refetchInterval: 30_000, refetchIntervalInBackground: false });
  const movementsQuery = useQuery({ queryKey: MOVEMENTS_QUERY_KEY, queryFn: inventoryService.getMovements, refetchInterval: 30_000, refetchIntervalInBackground: false });
  const [activeTab, setActiveTab] = useState<"stocks" | "movements">("stocks");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<WarehouseStockItem | null>(null);
  const refreshInventory = () => Promise.all([stocksQuery.refetch(), movementsQuery.refetch()]);
  const adjustmentMutation = useMutation({
    mutationFn: inventoryService.createAdjustment,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: STOCKS_QUERY_KEY }); void queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY }); setIsAdjustmentOpen(false); setSelectedStockItem(null); },
  });
  const allStocks = stocksQuery.data ?? EMPTY_STOCKS;
  const allMovements = movementsQuery.data ?? EMPTY_MOVEMENTS;
  const stocks = useMemo(() => allStocks.filter((stock) => (warehouseFilter === "ALL" || stock.warehouseName === warehouseFilter) && (!searchQuery || `${stock.productName} ${stock.sku}`.toLowerCase().includes(searchQuery.toLowerCase()))), [allStocks, searchQuery, warehouseFilter]);
  const movements = useMemo(() => allMovements.filter((movement) => (warehouseFilter === "ALL" || movement.warehouseName === warehouseFilter) && (!searchQuery || `${movement.productName} ${movement.sku} ${movement.reference}`.toLowerCase().includes(searchQuery.toLowerCase()))), [allMovements, searchQuery, warehouseFilter]);

  return {
    activeTab, setActiveTab, stocks, movements, isLoading: stocksQuery.isLoading || movementsQuery.isLoading, isRefreshing: (stocksQuery.isFetching || movementsQuery.isFetching) && !(stocksQuery.isLoading || movementsQuery.isLoading), searchQuery, setSearchQuery, warehouseFilter, setWarehouseFilter,
    warehousesList: [...new Set(allStocks.map((stock) => stock.warehouseName))].sort(), metrics: inventoryService.calculateMetrics(allStocks, allMovements), isAdjustmentOpen, setIsAdjustmentOpen, selectedStockItem, isSubmitting: adjustmentMutation.isPending,
    refresh: refreshInventory, handleOpenAdjustment: (stockItem: WarehouseStockItem) => { setSelectedStockItem(stockItem); setIsAdjustmentOpen(true); }, handleSaveAdjustment: adjustmentMutation.mutateAsync,
  };
};
