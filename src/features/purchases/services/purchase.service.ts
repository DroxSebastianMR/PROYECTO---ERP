import { httpClient } from "@/lib/api/http-client";
import type {
  CreatePurchaseInput,
  PurchaseMetrics,
  PurchaseOrder,
  Supplier,
  SupplierInput,
  UpdatePurchaseInput,
  SupplierOption,
  WarehouseOption,
} from "@/features/purchases/types/purchase.types";

type Numeric = string | number;

type PurchaseApi = {
  id: string;
  number: string;
  supplierName: string;
  supplierId: string | null;
  warehouseId: string | null;
  status: PurchaseOrder["status"];
  currency: string;
  paymentMethod?: PurchaseOrder["paymentMethod"];
  notes?: string | null;
  purchasedAt?: string | null;
  warehouseEntryAt?: string | null;
  document?: { number: string } | null;
  total: Numeric;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: Numeric;
    receivedQuantity: Numeric;
    unitCost: Numeric;
    subtotal: Numeric;
    taxRate: Numeric;
    presentationName?: string | null;
    product: { sku: string; name: string; unit: string };
  }>;
};

type SupplierApi = Omit<Supplier, "purchasesCount"> & { _count?: { purchases: number } };
const mapSupplier = (supplier: SupplierApi): Supplier => ({
  ...supplier,
  purchasesCount: supplier._count?.purchases ?? 0,
});
type WarehouseApi = { id: string; name: string };

const toNumber = (value: Numeric | null | undefined) => Number(value ?? 0);

const mapPurchase = (purchase: PurchaseApi): PurchaseOrder => ({
  id: purchase.id,
  number: purchase.number,
  supplierName: purchase.supplierName,
  supplierId: purchase.supplierId,
  warehouseId: purchase.warehouseId,
  status: purchase.status,
  currency: purchase.currency,
  paymentMethod: purchase.paymentMethod,
  notes: purchase.notes,
  purchasedAt: purchase.purchasedAt,
  warehouseEntryAt: purchase.warehouseEntryAt,
  supplierDocumentNumber: purchase.document?.number ?? null,
  total: toNumber(purchase.total),
  createdAt: purchase.createdAt,
  updatedAt: purchase.updatedAt,
  items: purchase.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    sku: item.product.sku,
    productName: item.product.name,
    unit: item.product.unit,
    quantity: toNumber(item.quantity),
    receivedQuantity: toNumber(item.receivedQuantity),
    unitCost: toNumber(item.unitCost),
    subtotal: toNumber(item.subtotal),
    taxRate: toNumber(item.taxRate),
    presentationName: item.presentationName,
  })),
});

export const purchaseService = {
  async getPurchases(): Promise<PurchaseOrder[]> {
    return (await httpClient<PurchaseApi[]>("/purchases")).map(mapPurchase);
  },
  async getSuppliers(): Promise<SupplierOption[]> {
    const suppliers = await httpClient<SupplierApi[]>("/purchases/suppliers");
    return suppliers.filter((supplier) => supplier.isActive).map((supplier) => ({ id: supplier.id, name: supplier.businessName }));
  },
  async getSupplierCatalog(): Promise<Supplier[]> {
    return (await httpClient<SupplierApi[]>("/purchases/suppliers")).map(mapSupplier);
  },
  async createSupplier(input: SupplierInput): Promise<Supplier> {
    return mapSupplier(await httpClient<SupplierApi>("/purchases/suppliers", { method: "POST", body: JSON.stringify(input) }));
  },
  async updateSupplier(id: string, input: Partial<SupplierInput>): Promise<Supplier> {
    return mapSupplier(await httpClient<SupplierApi>(`/purchases/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(input) }));
  },
  async deleteSupplier(id: string): Promise<{ action: "deleted" | "deactivated" }> {
    return httpClient(`/purchases/suppliers/${id}`, { method: "DELETE" });
  },
  async getWarehouses(): Promise<WarehouseOption[]> {
    const warehouses = await httpClient<WarehouseApi[]>("/inventory/warehouses");
    return warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name }));
  },
  async createPurchase(input: CreatePurchaseInput): Promise<PurchaseOrder> {
    return mapPurchase(
      await httpClient<PurchaseApi>("/purchases", { method: "POST", body: JSON.stringify(input) }),
    );
  },
  async updatePurchase(id: string, input: UpdatePurchaseInput): Promise<PurchaseOrder> {
    return mapPurchase(await httpClient<PurchaseApi>(`/purchases/${id}`, { method: "PATCH", body: JSON.stringify(input) }));
  },
  async orderPurchase(id: string): Promise<PurchaseOrder> {
    return mapPurchase(await httpClient<PurchaseApi>(`/purchases/${id}/order`, { method: "POST" }));
  },
  async receivePurchase(purchase: PurchaseOrder): Promise<void> {
    const lines = purchase.items
      .filter((item) => item.quantity > item.receivedQuantity && item.id)
      .map((item) => ({
        purchaseItemId: item.id!,
        receivedQuantity: item.quantity - item.receivedQuantity,
      }));
    if (!purchase.warehouseId || lines.length === 0) return;
    await httpClient(`/purchases/${purchase.id}/receipts`, {
      method: "POST",
      body: JSON.stringify({ warehouseId: purchase.warehouseId, lines }),
    });
  },
  calculateMetrics(purchases: PurchaseOrder[]): PurchaseMetrics {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isCurrentMonth = (purchase: PurchaseOrder) => {
      const date = new Date(purchase.purchasedAt ?? purchase.createdAt);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    };
    const receivedStatuses: PurchaseOrder["status"][] = [
      "RECEIVED",
      "PARTIALLY_RECEIVED",
      "PENDING_PAYMENT",
      "PAID",
    ];

    return {
      totalMonthPurchases: purchases
        .filter((purchase) => isCurrentMonth(purchase) && receivedStatuses.includes(purchase.status))
        .reduce((total, purchase) => total + purchase.total, 0),
      pendingOrdersCount: purchases.filter((purchase) =>
        ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"].includes(purchase.status),
      ).length,
      receivedOrdersCount: purchases.filter((purchase) =>
        ["PENDING_PAYMENT", "PAID"].includes(purchase.status),
      ).length,
      suppliersCount: new Set(purchases.map((purchase) => purchase.supplierName)).size,
    };
  },
};
