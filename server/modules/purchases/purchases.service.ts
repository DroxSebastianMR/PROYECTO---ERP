import { MovementType, PaymentMethod, PurchaseStatus, type Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { inventoryService } from "../inventory/inventory.service.js";

export class PurchaseError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}
type PurchaseInput = {
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
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
    presentationName?: string;
    unit?: string;
    discount?: number;
    taxRate?: number;
  }[];
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

const includePurchase = {
  supplier: true,
  warehouse: true,
  items: { include: { product: true, receiptLines: true } },
  receipts: { include: { lines: true } },
  document: true,
  payable: { include: { payments: true } },
} satisfies Prisma.PurchaseInclude;
const totals = (items: PurchaseInput["items"]) =>
  items.reduce(
    (acc, item) => {
      const base = item.quantity * item.unitCost - (item.discount ?? 0);
      const tax = (base * (item.taxRate ?? 18)) / 100;
      return { subtotal: acc.subtotal + base, tax: acc.tax + tax };
    },
    { subtotal: 0, tax: 0 },
  );

export const purchasesService = {
  list(companyId: string) {
    return prisma.purchase.findMany({
      where: { companyId },
      include: includePurchase,
      orderBy: { createdAt: "desc" },
    });
  },
  getById(companyId: string, id: string) {
    return prisma.purchase.findFirst({ where: { id, companyId }, include: includePurchase });
  },
  listSuppliers(companyId: string) {
    return prisma.supplier.findMany({
      where: { companyId },
      include: { _count: { select: { purchases: true } } },
      orderBy: { businessName: "asc" },
    });
  },
  async createSupplier(companyId: string, input: SupplierInput) {
    const count = await prisma.supplier.count({ where: { companyId } });
    let sequence = count + 1;
    let code = `PRV${String(sequence).padStart(3, "0")}`;
    while (await prisma.supplier.findFirst({ where: { companyId, code }, select: { id: true } })) {
      code = `PRV${String(++sequence).padStart(3, "0")}`;
    }
    return prisma.supplier.create({ data: { companyId, code, ...input } });
  },
  async updateSupplier(companyId: string, id: string, input: Partial<SupplierInput>) {
    const supplier = await prisma.supplier.findFirst({ where: { id, companyId }, select: { id: true } });
    if (!supplier) throw new PurchaseError("Proveedor no encontrado.", 404);
    return prisma.supplier.update({ where: { id }, data: input });
  },
  async removeSupplier(companyId: string, id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId },
      include: { _count: { select: { purchases: true } } },
    });
    if (!supplier) throw new PurchaseError("Proveedor no encontrado.", 404);
    if (supplier._count.purchases > 0) {
      await prisma.supplier.update({ where: { id }, data: { isActive: false } });
      return { action: "deactivated" as const };
    }
    await prisma.supplier.delete({ where: { id } });
    return { action: "deleted" as const };
  },
  async create(companyId: string, input: PurchaseInput) {
    const supplier = input.supplierId
      ? await prisma.supplier.findFirst({
          where: { id: input.supplierId, companyId, isActive: true },
        })
      : input.supplierName?.trim()
        ? await (async () => {
            const existing = await prisma.supplier.findFirst({
              where: { companyId, businessName: input.supplierName!.trim() },
            });
            return (
              existing ??
              purchasesService.createSupplier(companyId, { businessName: input.supplierName!.trim() })
            );
          })()
        : null;
    const warehouse = input.warehouseId
      ? await prisma.warehouse.findFirst({
          where: { id: input.warehouseId, companyId, isActive: true },
        })
      : await prisma.warehouse.findFirst({
          where: { companyId, isActive: true },
          orderBy: { isPrimary: "desc" },
        });
    if (!supplier || !warehouse) throw new PurchaseError("Proveedor o almacén inválido.", 404);
    const products = await prisma.product.count({
      where: {
        companyId,
        isActive: true,
        id: { in: input.items.map((item) => item.productId) },
      },
    });
    if (products !== new Set(input.items.map((item) => item.productId)).size)
      throw new PurchaseError("Uno o más productos no pertenecen a la empresa.", 404);
    const amount = totals(input.items);
    const count = await prisma.purchase.count({ where: { companyId } });
    return prisma.purchase.create({
      data: {
        companyId,
        number: `OC-${String(count + 1).padStart(6, "0")}`,
        supplierId: supplier.id,
        supplierName: supplier.businessName,
        warehouseId: warehouse.id,
        expectedDeliveryAt: input.expectedDeliveryAt,
        purchasedAt: input.purchasedAt,
        warehouseEntryAt: input.warehouseEntryAt,
        notes: input.notes?.trim() || null,
        paymentMethod: input.paymentMethod ?? PaymentMethod.CREDIT,
        currency: input.currency ?? "PEN",
        subtotal: amount.subtotal,
        taxAmount: amount.tax,
        total: amount.subtotal + amount.tax,
        // El registro de una compra confirma la operación comercial. El stock
        // se incrementa recién al confirmar la recepción física.
        status: PurchaseStatus.ORDERED,
        items: {
          create: input.items.map((item) => ({
            ...item,
            subtotal: item.quantity * item.unitCost - (item.discount ?? 0),
            discount: item.discount ?? 0,
            taxRate: item.taxRate ?? 18,
            presentationName: item.presentationName?.trim() || null,
            unit: item.unit?.trim() || null,
          })),
        },
        ...(input.supplierDocumentNumber?.trim()
          ? {
              document: {
                create: {
                  type: "INVOICE",
                  number: input.supplierDocumentNumber.trim(),
                  issuedAt: input.purchasedAt ?? new Date(),
                },
              },
            }
          : {}),
      },
      include: includePurchase,
    });
  },
  async order(companyId: string, id: string) {
    const purchase = await this.getById(companyId, id);
    if (!purchase) throw new PurchaseError("Orden no encontrada.", 404);
    if (purchase.status !== PurchaseStatus.DRAFT)
      throw new PurchaseError("Solo se pueden ordenar compras en borrador.", 409);
    return prisma.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.ORDERED },
      include: includePurchase,
    });
  },
  async receive(
    companyId: string,
    userId: string,
    id: string,
    input: {
      warehouseId?: string;
      notes?: string;
      lines: {
        purchaseItemId: string;
        receivedQuantity: number;
        damagedQuantity?: number;
        lotNumber?: string;
        expiresAt?: Date;
      }[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id, companyId },
        include: { items: true },
      });
      if (!purchase) throw new PurchaseError("Orden no encontrada.", 404);
      if (
        ([PurchaseStatus.CANCELLED, PurchaseStatus.PAID] as PurchaseStatus[]).includes(
          purchase.status,
        )
      )
        throw new PurchaseError("La orden no permite recepciones.", 409);
      const warehouseId = input.warehouseId ?? purchase.warehouseId;
      if (!warehouseId) throw new PurchaseError("Debe indicar el almacén de ingreso.");
      const receipt = await tx.purchaseReceipt.create({
        data: {
          purchaseId: id,
          warehouseId,
          notes: input.notes,
          receivedById: userId,
          lines: {
            create: input.lines.map((line) => ({
              ...line,
              damagedQuantity: line.damagedQuantity ?? 0,
            })),
          },
        },
        include: { lines: true },
      });
      for (const line of input.lines) {
        const item = purchase.items.find((entry) => entry.id === line.purchaseItemId);
        if (!item) throw new PurchaseError("Detalle de compra inválido.");
        const accepted = line.receivedQuantity - (line.damagedQuantity ?? 0);
        const pending = Number(item.quantity) - Number(item.receivedQuantity);
        if (line.receivedQuantity <= 0 || line.receivedQuantity > pending || accepted < 0)
          throw new PurchaseError("La cantidad recibida no es válida.");
        await tx.purchaseItem.update({
          where: { id: item.id },
          data: { receivedQuantity: { increment: line.receivedQuantity } },
        });
        if (accepted > 0)
          await inventoryService.recordMovement(
            companyId,
            userId,
            {
              productId: item.productId,
              warehouseId,
              type: MovementType.PURCHASE_RECEIPT,
              quantity: accepted,
              reason: "Recepción de compra",
              documentRef: purchase.number,
            },
            tx,
          );
        if (line.lotNumber)
          await tx.inventoryBatch.upsert({
            where: {
              productId_warehouseId_lotNumber: {
                productId: item.productId,
                warehouseId,
                lotNumber: line.lotNumber,
              },
            },
            update: { quantity: { increment: accepted }, expiresAt: line.expiresAt },
            create: {
              productId: item.productId,
              warehouseId,
              lotNumber: line.lotNumber,
              expiresAt: line.expiresAt,
              quantity: accepted,
            },
          });
      }
      const refreshed = await tx.purchaseItem.findMany({ where: { purchaseId: id } });
      const completed = refreshed.every(
        (item) => Number(item.receivedQuantity) >= Number(item.quantity),
      );
      await tx.purchase.update({
        where: { id },
        data: {
          status: completed ? PurchaseStatus.PENDING_PAYMENT : PurchaseStatus.PARTIALLY_RECEIVED,
        },
      });
      if (completed)
        await tx.accountsPayable.upsert({
          where: { purchaseId: id },
          update: {},
          create: { purchaseId: id, originalAmount: purchase.total },
        });
      return receipt;
    });
  },
  async registerPayment(
    companyId: string,
    id: string,
    input: { amount: number; method: PaymentMethod; reference?: string },
  ) {
    const purchase = await this.getById(companyId, id);
    if (!purchase?.payable) throw new PurchaseError("La compra no tiene una deuda pendiente.", 409);
    const balance = Number(purchase.payable.originalAmount) - Number(purchase.payable.paidAmount);
    if (input.amount <= 0 || input.amount > balance)
      throw new PurchaseError("El pago supera el saldo pendiente.");
    return prisma.$transaction(async (tx) => {
      const payable = await tx.accountsPayable.update({
        where: { id: purchase.payable!.id },
        data: { paidAmount: { increment: input.amount }, payments: { create: input } },
        include: { payments: true },
      });
      const paid = Number(payable.paidAmount) >= Number(payable.originalAmount);
      await tx.accountsPayable.update({
        where: { id: payable.id },
        data: { status: paid ? "PAID" : "PARTIAL" },
      });
      if (paid) await tx.purchase.update({ where: { id }, data: { status: PurchaseStatus.PAID } });
      return payable;
    });
  },
};
