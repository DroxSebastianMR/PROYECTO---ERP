import type { MovementType } from "@/features/inventory/types/inventory.types";

const labels: Record<MovementType, string> = {
  IN: "Ingreso manual",
  OUT: "Salida manual",
  ADJUSTMENT: "Ajuste de inventario",
  INITIAL: "Inventario inicial",
  PURCHASE_RECEIPT: "Recepción de compra",
  SALE_DISPATCH: "Salida por venta",
  CUSTOMER_RETURN: "Devolución de cliente",
  SUPPLIER_RETURN: "Devolución a proveedor",
  TRANSFER_OUT: "Traslado de salida",
  TRANSFER_IN: "Traslado de entrada",
  POSITIVE_ADJUSTMENT: "Ajuste positivo",
  NEGATIVE_ADJUSTMENT: "Ajuste negativo",
  DAMAGED: "Producto dañado",
  EXPIRED: "Producto vencido",
};

export const movementLabel = (type: MovementType) => labels[type] ?? type;
export const movementDirection = (type: MovementType) =>
  ["IN", "INITIAL", "PURCHASE_RECEIPT", "CUSTOMER_RETURN", "TRANSFER_IN", "POSITIVE_ADJUSTMENT"].includes(type)
    ? "in"
    : ["OUT", "SALE_DISPATCH", "SUPPLIER_RETURN", "TRANSFER_OUT", "NEGATIVE_ADJUSTMENT", "DAMAGED", "EXPIRED"].includes(type)
      ? "out"
      : "adjustment";
