import type { SaleItem } from "@/features/sales/types/sale.types";

/** Profit before operating expenses: net sale amount less the registered product cost. */
export const calculateSaleItemProfit = (
  item: Pick<SaleItem, "quantity" | "unitPrice" | "unitCost" | "discount">,
) => (item.unitPrice - item.unitCost) * item.quantity - item.discount;
