import type { PaymentMethod } from "@prisma/client";

export type PurchaseItemInput = {
  productId: string;
  quantity: number;
  unitCost: number;
  presentationName?: string;
  unit?: string;
  discount?: number;
  taxRate?: number;
};

export type PurchaseInput = {
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  expectedDeliveryAt?: Date;
  purchasedAt?: Date;
  warehouseEntryAt?: Date;
  supplierDocumentNumber?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  currency?: string;
  items: PurchaseItemInput[];
};

export type SupplierInput = {
  ruc?: string;
  businessName: string;
  tradeName?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  paymentTermsDays?: number;
  isActive?: boolean;
};

export type PurchaseUpdateInput = {
  supplierId?: string;
  purchasedAt?: Date;
  warehouseEntryAt?: Date;
  supplierDocumentNumber?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  currency?: string;
};

export type PurchaseReceiptInput = {
  warehouseId?: string;
  notes?: string;
  lines: {
    purchaseItemId: string;
    receivedQuantity: number;
    damagedQuantity?: number;
    lotNumber?: string;
    expiresAt?: Date;
  }[];
};

export type PurchasePaymentInput = {
  amount: number;
  method: PaymentMethod;
  reference?: string;
};
