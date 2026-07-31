export type SaleStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PENDING_PAYMENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "PREPARING"
  | "DISPATCHED"
  | "CANCELLED";
export type SalePaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "YAPE_PLIN" | "CREDIT";
export type SaleDocumentType = "RECEIPT" | "INVOICE";

export interface SaleItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}
export interface SaleReceipt {
  id: string;
  number: string;
  customerName: string;
  customerDocument?: string;
  warehouseId: string | null;
  status: SaleStatus;
  paymentMethod: SalePaymentMethod;
  documentType: SaleDocumentType;
  total: number;
  subtotalAmount: number;
  igvAmount: number;
  createdAt: string;
  createdBy: string;
  items: SaleItem[];
}
export interface CustomerOption {
  id: string;
  name: string;
  document?: string | null;
  creditLimit: number;
  creditDays: number;
}
export interface WarehouseOption {
  id: string;
  name: string;
}
export interface CreateSaleInput {
  customerId?: string;
  warehouseId: string;
  paymentMethod: SalePaymentMethod;
  documentType: SaleDocumentType;
  idempotencyKey: string;
  dueAt?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number; discount?: number }>;
}
export interface SaleMetrics {
  todayTotalSales: number;
  vouchersIssuedCount: number;
  averageTicket: number;
  paidPercentage: number;
}
