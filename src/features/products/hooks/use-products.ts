import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/features/products/services/product.service";
import type {
  CreateProductInput,
  Product,
  ProductFilterState,
  UpdateProductInput,
} from "@/features/products/types/product.types";

const PRODUCTS_QUERY_KEY = ["products"] as const;
const EMPTY_PRODUCTS: Product[] = [];

export const useProducts = () => {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: productService.getProducts,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const measurementUnitsQuery = useQuery({
    queryKey: ["products", "measurement-units"],
    queryFn: productService.getMeasurementUnits,
  });
  const [filters, setFilters] = useState<ProductFilterState>({
    search: "",
    category: "ALL",
    status: "ALL",
  });
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });

  const saveMutation = useMutation({
    mutationFn: (input: CreateProductInput | UpdateProductInput) =>
      "id" in input ? productService.updateProduct(input) : productService.createProduct(input),
    onSuccess: () => {
      void invalidate();
      setIsFormOpen(false);
      setEditingProduct(null);
    },
  });
  const createMeasurementUnitMutation = useMutation({
    mutationFn: productService.createMeasurementUnit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", "measurement-units"] }),
  });
  const statusMutation = useMutation({
    mutationFn: (product: Product) =>
      productService.toggleProductStatus(product.id, !product.isActive),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      void invalidate();
      setIsDeleteOpen(false);
      setDeletingProduct(null);
    },
  });
  const allProducts = productsQuery.data ?? EMPTY_PRODUCTS;
  const filteredProducts = useMemo(
    () =>
      allProducts.filter((product) => {
        const matchSearch =
          !filters.search ||
          [product.name, product.sku, product.category, product.barcode ?? ""].some((value) =>
            value.toLowerCase().includes(filters.search.toLowerCase()),
          );
        const matchCategory = filters.category === "ALL" || product.category === filters.category;
        const matchStatus = filters.status === "ALL" || (filters.status === "ACTIVE" ? product.isActive : !product.isActive);
        return matchSearch && matchCategory && matchStatus;
      }),
    [allProducts, filters],
  );
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const products = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    products,
    allProductsCount: allProducts.length,
    isLoading: productsQuery.isLoading,
    isRefreshing: productsQuery.isFetching && !productsQuery.isLoading,
    error: productsQuery.error instanceof Error ? productsQuery.error.message : null,
    filters,
    setFilters: (next: ProductFilterState) => {
      setPage(1);
      setFilters(next);
    },
    categories: [...new Set(allProducts.map((product) => product.category))].sort(),
    measurementUnits: measurementUnitsQuery.data ?? [],
    metrics: productService.calculateMetrics(filteredProducts),
    pagination: { page: currentPage, pageCount, total: filteredProducts.length, setPage },
    isFormOpen,
    setIsFormOpen,
    editingProduct,
    isDetailOpen,
    setIsDetailOpen,
    selectedProduct,
    isDeleteOpen,
    setIsDeleteOpen,
    deletingProduct,
    isSubmitting: saveMutation.isPending || deleteMutation.isPending,
    refresh: () => productsQuery.refetch(),
    handleOpenCreateModal: () => {
      setEditingProduct(null);
      setIsFormOpen(true);
    },
    handleOpenEditModal: (product: Product) => {
      setEditingProduct(product);
      setIsFormOpen(true);
    },
    handleOpenDetailModal: (product: Product) => {
      setSelectedProduct(product);
      setIsDetailOpen(true);
    },
    handleOpenDeleteModal: (product: Product) => {
      setDeletingProduct(product);
      setIsDeleteOpen(true);
    },
    handleSaveProduct: async (input: CreateProductInput | UpdateProductInput) => {
      await saveMutation.mutateAsync(input);
    },
    handleCreateMeasurementUnit: (input: { code: string; name: string }) =>
      createMeasurementUnitMutation.mutateAsync(input),
    handleToggleStatus: statusMutation.mutateAsync,
    handleDeleteProduct: () =>
      deletingProduct ? deleteMutation.mutateAsync(deletingProduct.id) : Promise.resolve(),
  };
};
