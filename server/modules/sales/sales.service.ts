import {
  MovementType,
  SaleDocumentType,
  SalePaymentMethod,
  SaleStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { inventoryService } from "../inventory/inventory.service.js";

export class SaleError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}
export type SaleInput = {
  customerId?: string;
  warehouseId: string;
  paymentMethod: SalePaymentMethod;
  documentType: SaleDocumentType;
  idempotencyKey: string;
  dueAt?: Date;
  items: Array<{ productId: string; quantity: number; unitPrice: number; discount?: number }>;
};
const includeSale = {
  customer: true,
  createdBy: true,
  warehouse: true,
  document: true,
  payments: true,
  items: { include: { product: true, returnLines: true } },
  dispatches: true,
  returns: { include: { lines: true } },
} satisfies Prisma.SaleInclude;
const toMoney = (value: number) => Math.round(value * 100) / 100;

const calculate = (items: SaleInput["items"]) =>
  items.reduce(
    (total, item) => {
      const gross = item.quantity * item.unitPrice - (item.discount ?? 0);
      const subtotal = gross / 1.18;
      return {
        subtotal: total.subtotal + subtotal,
        tax: total.tax + gross - subtotal,
        discount: total.discount + (item.discount ?? 0),
        total: total.total + gross,
      };
    },
    { subtotal: 0, tax: 0, discount: 0, total: 0 },
  );

export const salesService = {
  list(companyId: string) {
    return prisma.sale.findMany({
      where: { companyId },
      include: includeSale,
      orderBy: { createdAt: "desc" },
    });
  },
  get(companyId: string, id: string) {
    return prisma.sale.findFirst({ where: { id, companyId }, include: includeSale });
  },
  listCustomers(companyId: string) {
    return prisma.customer.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
    });
  },
  async createCustomer(
    companyId: string,
    input: {
      name: string;
      document?: string;
      email?: string;
      phone?: string;
      creditLimit?: number;
      creditDays?: number;
    },
  ) {
    const count = await prisma.customer.count({ where: { companyId } });
    return prisma.customer.create({
      data: { companyId, code: `CLI-${String(count + 1).padStart(6, "0")}`, ...input },
    });
  },
  async create(companyId: string, userId: string, input: SaleInput) {
    const existing = await prisma.sale.findFirst({
      where: { companyId, idempotencyKey: input.idempotencyKey },
      include: includeSale,
    });
    if (existing) return existing;
    const [warehouse, customer] = await Promise.all([
      prisma.warehouse.findFirst({ where: { id: input.warehouseId, companyId, isActive: true } }),
      input.customerId
        ? prisma.customer.findFirst({ where: { id: input.customerId, companyId, isActive: true } })
        : null,
    ]);
    if (!warehouse) throw new SaleError("Almacén de venta inválido.", 404);
    if (input.customerId && !customer) throw new SaleError("Cliente inválido.", 404);
    if (input.paymentMethod === SalePaymentMethod.CREDIT && !customer)
      throw new SaleError("Una venta al crédito requiere cliente.");
    if (input.paymentMethod === SalePaymentMethod.CREDIT && !input.dueAt)
      throw new SaleError("Indica la fecha de vencimiento del crédito.");
    const productCount = await prisma.product.count({
      where: { companyId, isActive: true, id: { in: input.items.map((item) => item.productId) } },
    });
    if (productCount !== new Set(input.items.map((item) => item.productId)).size)
      throw new SaleError("Uno o más productos no son válidos.", 404);
    const amount = calculate(input.items);
    if (customer && input.paymentMethod === SalePaymentMethod.CREDIT) {
      const balance = await prisma.sale.aggregate({
        where: {
          customerId: customer.id,
          status: { in: [SaleStatus.PENDING_PAYMENT, SaleStatus.PARTIALLY_PAID] },
        },
        _sum: { total: true },
      });
      if (Number(balance._sum.total ?? 0) + amount.total > Number(customer.creditLimit))
        throw new SaleError("La venta supera el límite de crédito del cliente.", 409);
    }
    return prisma.$transaction(
      async (tx) => {
        const count = await tx.sale.count({ where: { companyId } });
        const number = `V-${String(count + 1).padStart(6, "0")}`;
        const paid = input.paymentMethod !== SalePaymentMethod.CREDIT;
        const sale = await tx.sale.create({
          data: {
            companyId,
            createdById: userId,
            number,
            idempotencyKey: input.idempotencyKey,
            customerId: customer?.id,
            warehouseId: warehouse.id,
            paymentMethod: input.paymentMethod,
            documentType: input.documentType,
            dueAt: input.dueAt,
            status: paid ? SaleStatus.PAID : SaleStatus.PENDING_PAYMENT,
            subtotal: toMoney(amount.subtotal),
            taxAmount: toMoney(amount.tax),
            discountAmount: toMoney(amount.discount),
            total: toMoney(amount.total),
            items: {
              create: input.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount ?? 0,
                taxRate: 18,
                subtotal: toMoney(item.quantity * item.unitPrice - (item.discount ?? 0)),
              })),
            },
            document: {
              create: {
                type: input.documentType,
                series: input.documentType === SaleDocumentType.INVOICE ? "F001" : "B001",
                number,
              },
            },
            ...(paid
              ? {
                  payments: {
                    create: { amount: toMoney(amount.total), method: input.paymentMethod },
                  },
                }
              : {}),
          },
          include: includeSale,
        });
        for (const item of sale.items)
          await inventoryService.recordMovement(
            companyId,
            userId,
            {
              productId: item.productId,
              warehouseId: warehouse.id,
              type: MovementType.SALE_DISPATCH,
              quantity: Number(item.quantity),
              reason: "Venta cobrada",
              documentRef: sale.number,
            },
            tx,
          );
        return sale;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
  },
  async confirm(companyId: string, userId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id, companyId }, include: { items: true } });
      if (!sale) throw new SaleError("Venta no encontrada.", 404);
      if (sale.status !== SaleStatus.DRAFT)
        throw new SaleError("Solo se confirman ventas en borrador.", 409);
      if (!sale.warehouseId) throw new SaleError("La venta no tiene almacén.");
      for (const item of sale.items)
        await inventoryService.recordMovement(
          companyId,
          userId,
          {
            productId: item.productId,
            warehouseId: sale.warehouseId,
            type: MovementType.SALE_DISPATCH,
            quantity: Number(item.quantity),
            reason: "Venta confirmada",
            documentRef: sale.number,
          },
          tx,
        );
      const paid = sale.paymentMethod !== SalePaymentMethod.CREDIT;
      const status = paid ? SaleStatus.PAID : SaleStatus.PENDING_PAYMENT;
      const updated = await tx.sale.update({
        where: { id },
        data: {
          status,
          document: {
            create: {
              type: sale.documentType,
              series: sale.documentType === SaleDocumentType.INVOICE ? "F001" : "B001",
              number: sale.number,
            },
          },
          ...(paid
            ? { payments: { create: { amount: sale.total, method: sale.paymentMethod } } }
            : {}),
        },
        include: includeSale,
      });
      return updated;
    });
  },
  async addPayment(
    companyId: string,
    id: string,
    input: { amount: number; method: SalePaymentMethod; reference?: string },
  ) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id, companyId },
        include: { payments: true },
      });
      if (
        !sale ||
        !(sale.status === SaleStatus.PENDING_PAYMENT || sale.status === SaleStatus.PARTIALLY_PAID)
      )
        throw new SaleError("La venta no admite pagos.", 409);
      const paid = sale.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const remaining = Number(sale.total) - paid;
      if (input.amount <= 0 || input.amount > remaining)
        throw new SaleError("El pago excede el saldo pendiente.");
      await tx.salePayment.create({ data: { saleId: id, ...input } });
      const status = input.amount >= remaining ? SaleStatus.PAID : SaleStatus.PARTIALLY_PAID;
      return tx.sale.update({ where: { id }, data: { status }, include: includeSale });
    });
  },
  async dispatch(companyId: string, userId: string, id: string, notes?: string) {
    const sale = await this.get(companyId, id);
    if (!sale || !sale.warehouseId) throw new SaleError("Venta no encontrada.", 404);
    if (sale.status === SaleStatus.DRAFT || sale.status === SaleStatus.CANCELLED)
      throw new SaleError("La venta no está lista para despacho.", 409);
    return prisma.sale.update({
      where: { id },
      data: {
        status: SaleStatus.DISPATCHED,
        dispatches: { create: { warehouseId: sale.warehouseId, dispatchedById: userId, notes } },
      },
      include: includeSale,
    });
  },
  async registerReturn(
    companyId: string,
    userId: string,
    id: string,
    input: {
      warehouseId: string;
      reason: string;
      lines: Array<{ saleItemId: string; quantity: number }>;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id, companyId },
        include: { items: { include: { returnLines: true } } },
      });
      if (!sale || sale.status === SaleStatus.DRAFT || sale.status === SaleStatus.CANCELLED)
        throw new SaleError("La venta no admite devoluciones.", 409);
      const result = await tx.saleReturn.create({
        data: {
          saleId: id,
          warehouseId: input.warehouseId,
          reason: input.reason,
          createdById: userId,
          lines: { create: input.lines },
        },
        include: { lines: true },
      });
      for (const line of input.lines) {
        const item = sale.items.find((entry) => entry.id === line.saleItemId);
        const alreadyReturned =
          item?.returnLines.reduce((sum, entry) => sum + Number(entry.quantity), 0) ?? 0;
        if (!item || line.quantity <= 0 || line.quantity + alreadyReturned > Number(item.quantity))
          throw new SaleError("Cantidad de devolución no válida.");
        await inventoryService.recordMovement(
          companyId,
          userId,
          {
            productId: item.productId,
            warehouseId: input.warehouseId,
            type: MovementType.CUSTOMER_RETURN,
            quantity: line.quantity,
            reason: input.reason,
            documentRef: sale.number,
          },
          tx,
        );
      }
      return result;
    });
  },
};
