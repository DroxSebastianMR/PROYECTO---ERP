import type { SalePaymentMethod, SaleStatus } from "@/features/sales/types/sale.types";

export const salePaymentMethodLabels: Record<SalePaymentMethod, string> = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia bancaria",
  CARD: "Tarjeta",
  YAPE_PLIN: "Yape / Plin",
  CREDIT: "Crédito",
};

export const saleStatusLabels: Record<SaleStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  PENDING_PAYMENT: "Pendiente de pago",
  PARTIALLY_PAID: "Pago parcial",
  PAID: "Pagado",
  PREPARING: "En preparación",
  DISPATCHED: "Entregada",
  CANCELLED: "Anulada",
};

export const salePaymentMethodLabel = (method: SalePaymentMethod) => salePaymentMethodLabels[method];
export const saleStatusLabel = (status: SaleStatus) => saleStatusLabels[status];
