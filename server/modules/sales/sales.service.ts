import {
  CashSessionStatus,
  MovementType,
  SaleDocumentType,
  SalePaymentMethod,
  SaleStatus,
  TaxTreatment,
  type UserRole,
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
  payments?: Array<{ method: "CASH" | "BANK_TRANSFER" | "CARD" | "YAPE_PLIN"; amount: number }>;
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
const DNI_REQUIRED_FROM = 700;
const BANK_TRANSFER_REQUIRED_ABOVE = 2000;
const hasValidDni = (document?: string | null) => /^\d{8}$/.test(document?.trim() ?? "");
const saleScope = (companyId: string, userId?: string, _role?: UserRole, permissions?: readonly string[]) => ({
  companyId,
  ...(permissions?.includes("sales.history.view_own") && !permissions.includes("sales.history.view_all") ? userId ? { createdById: userId } : {} : {}),
});

type SaleCalculationItem = SaleInput["items"][number] & { taxTreatment: TaxTreatment };

const calculate = (items: SaleCalculationItem[]) =>
  items.reduce(
    (total, item) => {
      const subtotal = item.quantity * item.unitPrice - (item.discount ?? 0);
      const isTaxed = item.taxTreatment === TaxTreatment.TAXED;
      const tax = isTaxed ? subtotal * 0.18 : 0;
      return {
        subtotal: total.subtotal + subtotal,
        tax: total.tax + tax,
        discount: total.discount + (item.discount ?? 0),
        total: total.total + subtotal + tax,
      };
    },
    { subtotal: 0, tax: 0, discount: 0, total: 0 },
  );

/** Applies all sale stock reductions without repeating product and warehouse lookups per item. */
const recordSaleDispatches = async (
  tx: Prisma.TransactionClient,
  userId: string,
  warehouseId: string,
  saleNumber: string,
  items: SaleInput["items"],
) => {
  const quantities = new Map<string, number>();
  for (const item of items)
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);

  const productIds = [...quantities.keys()];
  const stocks = await tx.inventoryStock.findMany({
    where: { warehouseId, productId: { in: productIds } },
    select: { id: true, productId: true, quantity: true },
  });
  const stockByProduct = new Map(stocks.map((stock) => [stock.productId, stock]));
  const updates = productIds.map((productId) => {
    const stock = stockByProduct.get(productId);
    const quantity = quantities.get(productId)!;
    const previousStock = Number(stock?.quantity ?? 0);
    const resultingStock = previousStock - quantity;
    if (!stock || resultingStock < 0)
      throw new SaleError("Stock insuficiente para registrar la salida.", 409);
    return { productId, stockId: stock.id, quantity, previousStock, resultingStock };
  });

  await Promise.all(
    updates.map((update) =>
      tx.inventoryStock.update({
        where: { id: update.stockId },
        data: { quantity: update.resultingStock },
      }),
    ),
  );
  await tx.inventoryMovement.createMany({
    data: updates.map((update) => ({
      productId: update.productId,
      warehouseId,
      type: MovementType.SALE_DISPATCH,
      quantity: update.quantity,
      quantityIn: 0,
      quantityOut: update.quantity,
      previousStock: update.previousStock,
      resultingStock: update.resultingStock,
      documentRef: saleNumber,
      reason: "Venta cobrada",
      reference: "Venta cobrada",
      createdById: userId,
    })),
  });
};

export const salesService = {
  list(companyId: string, userId?: string, _role?: UserRole, permissions?: readonly string[]) {
    return prisma.sale.findMany({
      where: saleScope(companyId, userId, _role, permissions),
      include: includeSale,
      orderBy: { createdAt: "desc" },
    });
  },
  get(companyId: string, id: string, userId?: string, _role?: UserRole, permissions?: readonly string[]) {
    return prisma.sale.findFirst({ where: { id, ...saleScope(companyId, userId, _role, permissions) }, include: includeSale });
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
  async create(companyId: string, userId: string, input: SaleInput, _role?: unknown) {
    if (!input.warehouseId) {
      const primaryWarehouse = await prisma.warehouse.findFirst({
        where: { companyId, isActive: true, isPrimary: true },
        select: { id: true },
      });
      if (!primaryWarehouse) throw new SaleError("No hay un almacén principal activo para registrar ventas.", 409);
      input = { ...input, warehouseId: primaryWarehouse.id };
    }
    const existing = await prisma.sale.findFirst({
      where: { companyId, idempotencyKey: input.idempotencyKey },
      select: { id: true },
    });
    if (existing)
      return prisma.sale.findFirstOrThrow({ where: { id: existing.id, companyId }, include: includeSale });

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const [warehouse, customer, products] = await Promise.all([
      prisma.warehouse.findFirst({ where: { id: input.warehouseId, companyId, isActive: true } }),
      input.customerId
        ? prisma.customer.findFirst({ where: { id: input.customerId, companyId, isActive: true } })
        : null,
      prisma.product.findMany({
        where: { companyId, isActive: true, id: { in: productIds } },
        select: { id: true, taxTreatment: true, purchasePrice: true },
      }),
    ]);
    if (!warehouse) throw new SaleError("Almacén de venta inválido.", 404);
    if (input.customerId && !customer) throw new SaleError("Cliente inválido.", 404);
    if (products.length !== productIds.length)
      throw new SaleError("Uno o más productos no son válidos.", 404);

    const productById = new Map(products.map((product) => [product.id, product]));
    const itemsWithTaxTreatment = input.items.map((item) => ({
      ...item,
      taxTreatment: productById.get(item.productId)!.taxTreatment,
      unitCost: Number(productById.get(item.productId)!.purchasePrice ?? 0),
    }));
    const amount = calculate(itemsWithTaxTreatment);
    const payments = input.paymentMethod === SalePaymentMethod.CREDIT
      ? []
      : input.payments?.length
        ? input.payments
        : [{ method: input.paymentMethod as "CASH" | "BANK_TRANSFER" | "CARD" | "YAPE_PLIN", amount: amount.total }];
    const requiresOpenCashSession = payments.some((payment) => payment.method === SalePaymentMethod.CASH);
    const openCashSession = requiresOpenCashSession
      ? await prisma.cashSession.findFirst({ where: { companyId, status: CashSessionStatus.OPEN }, select: { id: true } })
      : null;
    if (amount.total >= DNI_REQUIRED_FROM && !hasValidDni(customer?.document))
      throw new SaleError("Las ventas desde S/ 700.00 requieren un cliente con DNI válido.", 422);
    if (amount.total > BANK_TRANSFER_REQUIRED_ABOVE && input.paymentMethod !== SalePaymentMethod.BANK_TRANSFER)
      throw new SaleError("Las ventas mayores a S/ 2,000.00 deben pagarse mediante transferencia bancaria.", 422);
    if (amount.total > BANK_TRANSFER_REQUIRED_ABOVE && payments.some((payment) => payment.method !== SalePaymentMethod.BANK_TRANSFER))
      throw new SaleError("Las ventas mayores a S/ 2,000.00 no admiten pagos combinados.", 422);
    if (input.paymentMethod === SalePaymentMethod.CREDIT && !customer)
      throw new SaleError("Una venta al crédito requiere cliente.");
    if (input.paymentMethod === SalePaymentMethod.CREDIT && !input.dueAt)
      throw new SaleError("Indica la fecha de vencimiento del crédito.");
    if (input.paymentMethod === SalePaymentMethod.CREDIT && input.payments?.length)
      throw new SaleError("Una venta al crédito no puede combinar métodos de pago.");
    if (requiresOpenCashSession && !openCashSession)
      throw new SaleError("Debe abrir una caja antes de registrar ventas en efectivo.", 409);
    if (payments.length && Math.abs(payments.reduce((sum, payment) => sum + payment.amount, 0) - amount.total) > 0.009)
      throw new SaleError("La suma de los pagos debe coincidir con el total de la venta.");
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
    const saleId = await prisma.$transaction(
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
              create: itemsWithTaxTreatment.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitCost: toMoney(item.unitCost),
                discount: item.discount ?? 0,
                taxRate: item.taxTreatment === TaxTreatment.TAXED ? 18 : 0,
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
                  payments: { create: payments.map((payment) => ({ amount: toMoney(payment.amount || amount.total), method: payment.method })) },
                }
              : {}),
          },
          select: { id: true, number: true },
        });
        await recordSaleDispatches(tx, userId, warehouse.id, sale.number, input.items);
        return sale.id;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
    return prisma.sale.findFirstOrThrow({ where: { id: saleId, companyId }, include: includeSale });
  },
  async confirm(companyId: string, userId: string, id: string, role?: UserRole) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id, ...saleScope(companyId, userId, role) }, include: { items: true } });
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
    input: { amount: number; method: SalePaymentMethod; reference?: string }, userId?: string, role?: UserRole,
  ) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id, ...saleScope(companyId, userId, role) },
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
  async dispatch(companyId: string, userId: string, id: string, notes?: string, role?: UserRole) {
    const sale = await this.get(companyId, id, userId, role);
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
    }, role?: UserRole,
  ) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id, ...saleScope(companyId, userId, role) },
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
