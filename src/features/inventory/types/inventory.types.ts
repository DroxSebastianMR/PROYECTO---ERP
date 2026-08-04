export type MovementType =
  | "IN"
  | "OUT"
  | "ADJUSTMENT"
  | "INITIAL"
  | "PURCHASE_RECEIPT"
  | "SALE_DISPATCH"
  | "CUSTOMER_RETURN"
  | "SUPPLIER_RETURN"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "POSITIVE_ADJUSTMENT"
  | "NEGATIVE_ADJUSTMENT"
  | "DAMAGED"
  | "EXPIRED";

export interface WarehouseStockItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minimum: number;
  reserved?: number;
  maximum?: number | null;
  unitCost: number;
}

export interface InventoryMovementRecord {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  warehouseName: string;
  type: MovementType;
  quantity: number;
  quantityIn?: number;
  quantityOut?: number;
  previousStock?: number | null;
  resultingStock?: number | null;
  reference: string;
  createdAt: string;
  responsible?: string;
}

export interface StockAdjustmentInput {
  productId: string;
  warehouseId: string;
  type: MovementType;
  quantity: number;
  reason: string;
}

export interface InventoryMetrics {
  totalUnits: number;
  inventoryValue: number;
  todayMovementsCount: number;
  lowStockItemsCount: number;
}
