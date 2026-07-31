import { httpClient } from "@/lib/api/http-client";
import type {
  InventoryMetrics,
  InventoryMovementRecord,
  StockAdjustmentInput,
  WarehouseStockItem,
} from "@/features/inventory/types/inventory.types";

const value = (input: string | number | null | undefined) => Number(input ?? 0);
type StockApi = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: string | number;
  minimum: string | number;
  reserved: string | number;
  maximum: string | number | null;
  product: { sku: string; name: string; unit: string };
  warehouse: { name: string };
};
type MovementApi = {
  id: string;
  productId: string;
  type: InventoryMovementRecord["type"];
  quantity: string | number;
  quantityIn: string | number;
  quantityOut: string | number;
  previousStock: string | number | null;
  resultingStock: string | number | null;
  documentRef?: string | null;
  reference?: string | null;
  reason?: string | null;
  createdAt: string;
  product: { sku: string; name: string; unit: string };
  warehouse: { name: string };
  createdBy?: { fullName: string } | null;
};

export const inventoryService = {
  async getStocks(): Promise<WarehouseStockItem[]> {
    const data = await httpClient<StockApi[]>("/inventory/stocks");
    return data.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      productName: item.product.name,
      unit: item.product.unit,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouse.name,
      quantity: value(item.quantity),
      minimum: value(item.minimum),
      reserved: value(item.reserved),
      maximum: item.maximum === null ? null : value(item.maximum),
    }));
  },
  async getMovements(): Promise<InventoryMovementRecord[]> {
    const data = await httpClient<MovementApi[]>("/inventory/movements");
    return data.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      productName: item.product.name,
      unit: item.product.unit,
      warehouseName: item.warehouse.name,
      type: item.type,
      quantity: value(item.quantity),
      quantityIn: value(item.quantityIn),
      quantityOut: value(item.quantityOut),
      previousStock: item.previousStock === null ? null : value(item.previousStock),
      resultingStock: item.resultingStock === null ? null : value(item.resultingStock),
      reference: item.documentRef || item.reference || item.reason || "Sin referencia",
      createdAt: item.createdAt,
      responsible: item.createdBy?.fullName || "Sistema",
    }));
  },
  async createAdjustment(input: StockAdjustmentInput): Promise<void> {
    if (input.type === "ADJUSTMENT") {
      throw new Error("Los conteos físicos deben enviarse para aprobación antes de ajustar stock.");
    }
    const type = input.type === "IN" ? "POSITIVE_ADJUSTMENT" : "NEGATIVE_ADJUSTMENT";
    await httpClient("/inventory/movements", {
      method: "POST",
      body: JSON.stringify({
        productId: input.productId,
        warehouseId: input.warehouseId,
        type,
        quantity: input.quantity,
        reason: input.reason,
      }),
    });
  },
  calculateMetrics(
    stocks: WarehouseStockItem[],
    movements: InventoryMovementRecord[],
  ): InventoryMetrics {
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalUnits: stocks.reduce((total, item) => total + item.quantity, 0),
      activeWarehouses: new Set(stocks.map((item) => item.warehouseId)).size,
      todayMovementsCount: movements.filter((item) => item.createdAt.startsWith(today)).length,
      lowStockItemsCount: stocks.filter((item) => item.quantity <= item.minimum).length,
    };
  },
};
