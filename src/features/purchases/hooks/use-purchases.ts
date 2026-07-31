import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/features/products/services/product.service";
import { purchaseService } from "@/features/purchases/services/purchase.service";
import type {
  CreatePurchaseInput,
  PurchaseOrder,
  PurchaseStatus,
} from "@/features/purchases/types/purchase.types";

const PURCHASES_QUERY_KEY = ["purchases"] as const;
const SUPPLIERS_QUERY_KEY = ["purchases", "suppliers"] as const;
const WAREHOUSES_QUERY_KEY = ["inventory", "warehouses"] as const;
const PRODUCTS_QUERY_KEY = ["products"] as const;
const EMPTY_PURCHASES: PurchaseOrder[] = [];

export const usePurchases = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PurchaseStatus>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);

  const purchasesQuery = useQuery({
    queryKey: PURCHASES_QUERY_KEY,
    queryFn: purchaseService.getPurchases,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const suppliersQuery = useQuery({
    queryKey: SUPPLIERS_QUERY_KEY,
    queryFn: purchaseService.getSuppliers,
  });
  const warehousesQuery = useQuery({
    queryKey: WAREHOUSES_QUERY_KEY,
    queryFn: purchaseService.getWarehouses,
  });
  const productsQuery = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: productService.getProducts,
  });

  const invalidatePurchaseData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["inventory", "stocks"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory", "movements"] }),
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: purchaseService.createPurchase,
    onSuccess: async () => {
      await invalidatePurchaseData();
      setIsFormOpen(false);
    },
  });
  const orderMutation = useMutation({
    mutationFn: purchaseService.orderPurchase,
    onSuccess: invalidatePurchaseData,
  });
  const receiptMutation = useMutation({
    mutationFn: purchaseService.receivePurchase,
    onSuccess: async () => {
      await invalidatePurchaseData();
      setIsDetailOpen(false);
      setSelectedPurchase(null);
    },
  });

  const purchases = purchasesQuery.data ?? EMPTY_PURCHASES;
  const filteredPurchases = useMemo(
    () =>
      purchases.filter((purchase) => {
        const search = searchQuery.toLowerCase();
        return (
          (!search ||
            purchase.number.toLowerCase().includes(search) ||
            purchase.supplierName.toLowerCase().includes(search)) &&
          (statusFilter === "ALL" || purchase.status === statusFilter)
        );
      }),
    [purchases, searchQuery, statusFilter],
  );

  const handleOpenDetailModal = (purchase: PurchaseOrder) => {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  };

  return {
    purchases: filteredPurchases,
    suppliers: suppliersQuery.data ?? [],
    warehouses: warehousesQuery.data ?? [],
    products: (productsQuery.data ?? []).filter((product) => product.isActive),
    isLoading: purchasesQuery.isLoading,
    isRefreshing: purchasesQuery.isFetching && !purchasesQuery.isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    metrics: purchaseService.calculateMetrics(purchases),
    isFormOpen,
    setIsFormOpen,
    isDetailOpen,
    setIsDetailOpen,
    selectedPurchase,
    isSubmitting: createMutation.isPending || orderMutation.isPending || receiptMutation.isPending,
    refresh: () => purchasesQuery.refetch(),
    handleOpenDetailModal,
    handleSavePurchase: (input: CreatePurchaseInput) => createMutation.mutateAsync(input),
    handleOrderPurchase: (id: string) => orderMutation.mutateAsync(id),
    handleReceivePurchase: (purchase: PurchaseOrder) => receiptMutation.mutateAsync(purchase),
  };
};
