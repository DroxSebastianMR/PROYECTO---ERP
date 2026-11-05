import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { CreateWarehouseInput, WarehouseStockItem } from "@/features/inventory/types/inventory.types";

const STOCKS_QUERY_KEY = ["inventory", "stocks"] as const;
const MOVEMENTS_QUERY_KEY = ["inventory", "movements"] as const;
const WAREHOUSES_QUERY_KEY = ["inventory", "warehouses"] as const;
const EMPTY_STOCKS: WarehouseStockItem[] = [];
const EMPTY_MOVEMENTS: Awaited<ReturnType<typeof inventoryService.getMovements>> = [];
type InventoryTab = "stocks" | "movements" | "warehouses";
type StockLevelFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export const useInventory = () => {
  const queryClient = useQueryClient();
  const stocksQuery = useQuery({ queryKey: STOCKS_QUERY_KEY, queryFn: inventoryService.getStocks, refetchInterval: 30_000, refetchIntervalInBackground: false });
  const movementsQuery = useQuery({ queryKey: MOVEMENTS_QUERY_KEY, queryFn: inventoryService.getMovements, refetchInterval: 30_000, refetchIntervalInBackground: false });
  const warehousesQuery = useQuery({ queryKey: WAREHOUSES_QUERY_KEY, queryFn: inventoryService.getWarehouses, staleTime: 30_000 });
  const [activeTab, setActiveTab] = useState<InventoryTab>("stocks");
  const [searchQuery, setSearchQuery] = useState(""); const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [stockLevelFilter, setStockLevelFilter] = useState<StockLevelFilter>("ALL"); const [stockPage, setStockPage] = useState(1); const [movementPage, setMovementPage] = useState(1);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false); const [isWarehouseOpen, setIsWarehouseOpen] = useState(false); const [selectedStockItem, setSelectedStockItem] = useState<WarehouseStockItem | null>(null);
  const adjustmentMutation = useMutation({ mutationFn: inventoryService.createAdjustment, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: STOCKS_QUERY_KEY }); void queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY }); setIsAdjustmentOpen(false); setSelectedStockItem(null); } });
  const warehouseMutation = useMutation({ mutationFn: inventoryService.createWarehouse, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY }); void queryClient.invalidateQueries({ queryKey: STOCKS_QUERY_KEY }); setIsWarehouseOpen(false); } });
  const allStocks = stocksQuery.data ?? EMPTY_STOCKS; const allMovements = movementsQuery.data ?? EMPTY_MOVEMENTS; const warehouses = warehousesQuery.data ?? [];
  const primaryWarehouse = warehouses.find((warehouse) => warehouse.isPrimary);
  const principalStocks = primaryWarehouse ? allStocks.filter((stock) => stock.warehouseId === primaryWarehouse.id) : allStocks;
  const stocks = useMemo(() => principalStocks.filter((stock) => (stockLevelFilter === "ALL" || (stockLevelFilter === "IN_STOCK" && stock.quantity > stock.minimum) || (stockLevelFilter === "LOW_STOCK" && stock.quantity > 0 && stock.quantity <= stock.minimum) || (stockLevelFilter === "OUT_OF_STOCK" && stock.quantity <= 0)) && (!searchQuery || `${stock.productName} ${stock.sku}`.toLowerCase().includes(searchQuery.toLowerCase()))), [principalStocks, searchQuery, stockLevelFilter]);
  const filteredMovements = useMemo(() => allMovements.filter((movement) => (warehouseFilter === "ALL" || movement.warehouseName === warehouseFilter) && (!searchQuery || `${movement.productName} ${movement.sku} ${movement.reference}`.toLowerCase().includes(searchQuery.toLowerCase()))), [allMovements, searchQuery, warehouseFilter]);
  const movements = filteredMovements;
  const stockPageCount = Math.max(1, Math.ceil(stocks.length / 10)); const movementPageCount = Math.max(1, Math.ceil(movements.length / 10)); const currentStockPage = Math.min(stockPage, stockPageCount); const currentMovementPage = Math.min(movementPage, movementPageCount);
  const isListTab = activeTab !== "warehouses";
  return { activeTab, setActiveTab, stocks: stocks.slice((currentStockPage - 1) * 10, currentStockPage * 10), movements: movements.slice((currentMovementPage - 1) * 10, currentMovementPage * 10), warehouses, primaryWarehouse, isListTab, pagination: activeTab === "stocks" ? { page: currentStockPage, pageCount: stockPageCount, total: stocks.length, setPage: setStockPage } : { page: currentMovementPage, pageCount: movementPageCount, total: movements.length, setPage: setMovementPage }, isLoading: stocksQuery.isLoading || movementsQuery.isLoading || warehousesQuery.isLoading, searchQuery, setSearchQuery, warehouseFilter, setWarehouseFilter, stockLevelFilter, setStockLevelFilter, warehousesList: warehouses.map((warehouse) => warehouse.name), metrics: inventoryService.calculateMetrics(principalStocks, allMovements), isAdjustmentOpen, setIsAdjustmentOpen, selectedStockItem, isWarehouseOpen, setIsWarehouseOpen, isSubmitting: adjustmentMutation.isPending, isCreatingWarehouse: warehouseMutation.isPending, handleOpenAdjustment: (stockItem: WarehouseStockItem) => { setSelectedStockItem(stockItem); setIsAdjustmentOpen(true); }, handleSaveAdjustment: adjustmentMutation.mutateAsync, handleCreateWarehouse: (input: CreateWarehouseInput) => warehouseMutation.mutateAsync(input) };
};
