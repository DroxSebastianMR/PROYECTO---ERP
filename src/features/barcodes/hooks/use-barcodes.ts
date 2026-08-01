import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { barcodeService } from "@/features/barcodes/services/barcode.service";
import type { BarcodeFormat } from "@/features/barcodes/types/barcode.types";
import { productService } from "@/features/products/services/product.service";

export const useBarcodes = () => {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [productId, setProductId] = useState("");
  const barcodesQuery = useQuery({ queryKey: ["barcodes", search], queryFn: () => barcodeService.list(search), staleTime: 20_000 });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: productService.getProducts, staleTime: 20_000 });
  const invalidate = () => client.invalidateQueries({ queryKey: ["barcodes"] });
  const generateMutation = useMutation({ mutationFn: barcodeService.generate });
  const createMutation = useMutation({ mutationFn: barcodeService.create, onSuccess: invalidate });
  const primaryMutation = useMutation({ mutationFn: barcodeService.setPrimary, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: barcodeService.remove, onSuccess: invalidate });
  const products = useMemo(() => (productsQuery.data ?? []).filter((product) => product.isActive), [productsQuery.data]);
  return { barcodes: barcodesQuery.data ?? [], products, search, setSearch, format, setFormat, productId, setProductId, generate: generateMutation.mutateAsync, create: createMutation.mutateAsync, setPrimary: primaryMutation.mutateAsync, remove: removeMutation.mutateAsync, isLoading: barcodesQuery.isLoading, isSaving: createMutation.isPending || generateMutation.isPending, error: barcodesQuery.error instanceof Error ? barcodesQuery.error.message : null };
};
