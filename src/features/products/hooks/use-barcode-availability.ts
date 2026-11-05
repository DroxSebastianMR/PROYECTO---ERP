import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/features/products/services/product.service";

const useDebouncedValue = (value: string, delay = 350) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
};

export const useBarcodeAvailability = (barcode: string, excludeProductId?: string) => {
  const normalizedBarcode = barcode.trim();
  const debouncedBarcode = useDebouncedValue(normalizedBarcode);
  const query = useQuery({
    queryKey: ["products", "barcode-availability", debouncedBarcode, excludeProductId],
    queryFn: () => productService.checkBarcodeAvailability(debouncedBarcode, excludeProductId),
    enabled: debouncedBarcode.length >= 3,
    staleTime: 30_000,
    retry: false,
  });

  return {
    isChecking: query.isFetching,
    isAvailable: normalizedBarcode.length >= 3 ? query.data?.available : undefined,
    message: query.data?.message,
  };
};
