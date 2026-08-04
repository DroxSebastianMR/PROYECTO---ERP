import { httpClient } from "@/lib/api/http-client";
import type {
  CreateSaleInput,
  CustomerOption,
  SaleMetrics,
  SaleReceipt,
  WarehouseOption,
} from "@/features/sales/types/sale.types";

type Numeric = string | number;
type SaleApi = {
  id: string;
  number: string;
  status: SaleReceipt["status"];
  paymentMethod: SaleReceipt["paymentMethod"];
  documentType: SaleReceipt["documentType"];
  warehouseId: string | null;
  total: Numeric;
  subtotal: Numeric;
  taxAmount: Numeric;
  createdAt: string;
  customer: { name: string; document?: string | null } | null;
  createdBy: { fullName: string };
  payments: Array<{ method: SaleReceipt["paymentMethod"]; amount: Numeric }>;
  items: Array<{
    id: string;
    productId: string;
    quantity: Numeric;
    unitPrice: Numeric;
    discount: Numeric;
    subtotal: Numeric;
    product: { sku: string; name: string; unit: string };
  }>;
};
const number = (value: Numeric | null | undefined) => Number(value ?? 0);
const mapSale = (sale: SaleApi): SaleReceipt => ({
  id: sale.id,
  number: sale.number,
  customerName: sale.customer?.name ?? "Cliente contado",
  customerDocument: sale.customer?.document ?? undefined,
  warehouseId: sale.warehouseId,
  status: sale.status,
  paymentMethod: sale.paymentMethod,
  documentType: sale.documentType,
  total: number(sale.total),
  subtotalAmount: number(sale.subtotal),
  igvAmount: number(sale.taxAmount),
  createdAt: sale.createdAt,
  createdBy: sale.createdBy.fullName,
  payments: sale.payments.map((payment) => ({ method: payment.method as Exclude<SaleReceipt["paymentMethod"], "CREDIT">, amount: number(payment.amount) })),
  items: sale.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    sku: item.product.sku,
    productName: item.product.name,
    unit: item.product.unit,
    quantity: number(item.quantity),
    unitPrice: number(item.unitPrice),
    discount: number(item.discount),
    subtotal: number(item.subtotal),
  })),
});

export const saleService = {
  async getSales() {
    return (await httpClient<SaleApi[]>("/sales")).map(mapSale);
  },
  async getCustomers(): Promise<CustomerOption[]> {
    const data =
      await httpClient<
        Array<{
          id: string;
          name: string;
          document?: string | null;
          creditLimit: Numeric;
          creditDays: number;
        }>
      >("/sales/customers");
    return data.map((customer) => ({ ...customer, creditLimit: number(customer.creditLimit) }));
  },
  async getWarehouses(): Promise<WarehouseOption[]> {
    return httpClient<WarehouseOption[]>("/inventory/warehouses");
  },
  async createCustomer(input: { name: string; document?: string; phone?: string; email?: string }) {
    return httpClient<CustomerOption>("/sales/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  async createSale(input: CreateSaleInput) {
    return mapSale(
      await httpClient<SaleApi>("/sales", { method: "POST", body: JSON.stringify(input) }),
    );
  },
  async confirmSale(id: string) {
    return mapSale(await httpClient<SaleApi>(`/sales/${id}/confirm`, { method: "POST" }));
  },
  async dispatchSale(id: string) {
    return mapSale(
      await httpClient<SaleApi>(`/sales/${id}/dispatch`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
  },
  calculateMetrics(sales: SaleReceipt[]): SaleMetrics {
    const completed = sales.filter((sale) =>
      ["PAID", "PARTIALLY_PAID", "DISPATCHED"].includes(sale.status),
    );
    const total = completed.reduce((sum, sale) => sum + sale.total, 0);
    return {
      todayTotalSales: total,
      vouchersIssuedCount: completed.length,
      averageTicket: completed.length ? total / completed.length : 0,
      paidPercentage: sales.length ? Math.round((completed.length / sales.length) * 100) : 0,
    };
  },
};
