import { Badge } from "@/components/ui/badge";
import type { Product } from "@/features/products/types/product.types";

interface ProductStatusBadgeProps {
  product: Product;
}

export const ProductStatusBadge = ({ product }: ProductStatusBadgeProps) => {
  if (!product.isActive) {
    return <Badge variant="secondary">Inactivo</Badge>;
  }

  return <Badge variant="success">Activo</Badge>;
};
