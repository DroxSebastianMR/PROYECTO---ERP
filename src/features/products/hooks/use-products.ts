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
  const [filters, setFilters] = useState<ProductFilterState>({
    search: "",
    category: "ALL",
    stockStatus: "ALL",
  });
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
  const products = useMemo(
    () =>
      allProducts.filter((product) => {
        const matchSearch =
          !filters.search ||
          [product.name, product.sku, product.category].some((value) =>
            value.toLowerCase().includes(filters.search.toLowerCase()),
          );
        const matchCategory = filters.category === "ALL" || product.category === filters.category;
        const matchStatus =
          filters.stockStatus === "ALL" ||
          (filters.stockStatus === "INACTIVE" && !product.isActive) ||
          (filters.stockStatus === "IN_STOCK" &&
            product.isActive &&
            product.totalStock > product.minStock) ||
          (filters.stockStatus === "LOW_STOCK" &&
            product.isActive &&
            product.totalStock > 0 &&
            product.totalStock <= product.minStock) ||
          (filters.stockStatus === "OUT_OF_STOCK" && product.isActive && product.totalStock <= 0);
        return matchSearch && matchCategory && matchStatus;
      }),
    [allProducts, filters],
  );

  return {
    products,
    allProductsCount: allProducts.length,
    isLoading: productsQuery.isLoading,
    isRefreshing: productsQuery.isFetching && !productsQuery.isLoading,
    error: productsQuery.error instanceof Error ? productsQuery.error.message : null,
    filters,
    setFilters,
    categories: [...new Set(allProducts.map((product) => product.category))].sort(),
    metrics: productService.calculateMetrics(allProducts),
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
    handleToggleStatus: statusMutation.mutateAsync,
    handleDeleteProduct: () =>
      deletingProduct ? deleteMutation.mutateAsync(deletingProduct.id) : Promise.resolve(),
  };
};
