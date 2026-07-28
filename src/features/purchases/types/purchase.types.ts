export type PurchaseStatus =
  | "DRAFT"
  | "ORDERED"
  | "RECEIVED"
  | "PARTIALLY_RECEIVED"
  | "PENDING_PAYMENT"
  | "PAID"
  | "CANCELLED";

export type PurchasePaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "CREDIT";

export interface PurchaseItem {
  id?: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierName: string;
  supplierId: string | null;
  warehouseId: string | null;
  status: PurchaseStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
}

export interface CreatePurchaseInput {
  supplierId: string;
  warehouseId: string;
  paymentMethod: PurchasePaymentMethod;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
}

export interface SupplierOption { id: string; name: string; }
export interface WarehouseOption { id: string; name: string; }

export interface PurchaseMetrics {
  totalMonthPurchases: number;
  pendingOrdersCount: number;
  receivedOrdersCount: number;
  suppliersCount: number;
}
