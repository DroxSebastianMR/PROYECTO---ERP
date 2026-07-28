import { Badge } from "@/components/ui/badge";
import type { Product } from "@/features/products/types/product.types";

interface ProductStatusBadgeProps {
  product: Product;
}

export const ProductStatusBadge = ({ product }: ProductStatusBadgeProps) => {
  if (!product.isActive) {
    return <Badge variant="secondary">Inactivo</Badge>;
  }

  if (product.totalStock === 0) {
    return <Badge variant="destructive">Sin Stock</Badge>;
  }

  if (product.totalStock <= product.minStock) {
    return <Badge variant="warning">Stock Bajo</Badge>;
  }

  return <Badge variant="success">Disponible</Badge>;
};
