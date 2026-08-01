import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/features/products/services/product.service";
import { customerService } from "@/features/customers/services/customer.service";
import type { CreateCustomerInput } from "@/features/customers/types/customer.types";
import { saleService } from "@/features/sales/services/sale.service";
import type { CreateSaleInput, SaleReceipt, SaleStatus } from "@/features/sales/types/sale.types";

const SALES_KEY = ["sales"] as const;
const EMPTY_SALES: SaleReceipt[] = [];
export const useSales = () => {
  const client = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | SaleStatus>("ALL");
  const [page, setPage] = useState(1);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleReceipt | null>(null);
  const salesQuery = useQuery({
    queryKey: SALES_KEY,
    queryFn: saleService.getSales,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: productService.getProducts });
  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getCustomers,
  });
  const warehousesQuery = useQuery({
    queryKey: ["inventory", "warehouses"],
    queryFn: saleService.getWarehouses,
  });
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: SALES_KEY }),
      client.invalidateQueries({ queryKey: ["inventory", "stocks"] }),
      client.invalidateQueries({ queryKey: ["inventory", "movements"] }),
      client.invalidateQueries({ queryKey: ["products"] }),
    ]);
  };
  const create = useMutation({
    mutationFn: saleService.createSale,
    onSuccess: () => {
      // La venta ya fue confirmada por la API. La sincronización es secundaria y
      // nunca debe impedir mostrar el ticket o finalizar el flujo del POS.
      void invalidate().catch(() => {
        // React Query volverá a sincronizar en su siguiente ciclo.
      });
      setIsPOSOpen(false);
    },
  });
  const createCustomer = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] }),
  });
  const confirm = useMutation({ mutationFn: saleService.confirmSale, onSuccess: invalidate });
  const dispatch = useMutation({ mutationFn: saleService.dispatchSale, onSuccess: invalidate });
  const sales = salesQuery.data ?? EMPTY_SALES;
  const filtered = useMemo(
    () =>
      sales.filter((sale) => {
        const term = searchQuery.toLowerCase();
        return (
          (!term ||
            sale.number.toLowerCase().includes(term) ||
            sale.customerName.toLowerCase().includes(term)) &&
          (statusFilter === "ALL" || sale.status === statusFilter)
        );
      }),
    [sales, searchQuery, statusFilter],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const paginatedSales = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  return {
    sales: paginatedSales,
    pagination: { page: currentPage, pageCount, total: filtered.length, setPage },
    products: productsQuery.data ?? [],
    customers: (customersQuery.data ?? [])
      .filter((customer) => customer.status === "ACTIVO")
      .map((customer) => ({
        id: customer.id,
        name: customer.companyName || `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
        document: customer.documentNumber,
        creditLimit: 0,
        creditDays: 0,
      })),
    warehouses: warehousesQuery.data ?? [],
    isLoading: salesQuery.isLoading,
    isRefreshing: salesQuery.isFetching && !salesQuery.isLoading,
    searchQuery,
    setSearchQuery: (value: string) => { setPage(1); setSearchQuery(value); },
    statusFilter,
    setStatusFilter: (value: "ALL" | SaleStatus) => { setPage(1); setStatusFilter(value); },
    metrics: saleService.calculateMetrics(sales),
    isPOSOpen,
    setIsPOSOpen,
    isDetailOpen,
    setIsDetailOpen,
    selectedSale,
    isSubmitting: create.isPending || confirm.isPending || dispatch.isPending,
    refresh: () => salesQuery.refetch(),
    handleOpenDetailModal: (sale: SaleReceipt) => {
      setSelectedSale(sale);
      setIsDetailOpen(true);
    },
    handleCreateSale: (input: CreateSaleInput) => create.mutateAsync(input),
    isCreatingCustomer: createCustomer.isPending,
    handleCreateCustomer: async (input: CreateCustomerInput) => {
      const customer = await createCustomer.mutateAsync(input);
      return {
        id: customer.id,
        name: customer.companyName || `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
        document: customer.documentNumber,
        creditLimit: 0,
        creditDays: 0,
      };
    },
    handleLookupCustomerDocument: customerService.lookupDocument,
    handleConfirmSale: (id: string) => confirm.mutateAsync(id),
    handleDispatchSale: (id: string) => dispatch.mutateAsync(id),
  };
};
