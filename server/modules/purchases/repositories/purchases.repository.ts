import { Prisma, type PurchaseStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

export const purchaseInclude = {
  supplier: true,
  warehouse: true,
  items: { include: { product: true, receiptLines: true } },
  receipts: { include: { lines: true } },
  document: true,
  payable: { include: { payments: true } },
} satisfies Prisma.PurchaseInclude;

const purchaseListInclude = {
  items: { include: { product: true } },
  document: true,
} satisfies Prisma.PurchaseInclude;

export type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export const purchasesRepository = {
  list(companyId: string) {
    return prisma.purchase.findMany({
      where: { companyId },
      include: purchaseListInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findById(companyId: string, id: string) {
    return prisma.purchase.findFirst({ where: { id, companyId }, include: purchaseInclude });
  },

  listSuppliers(companyId: string) {
    return prisma.supplier.findMany({
      where: { companyId },
      include: { _count: { select: { purchases: true } } },
      orderBy: { businessName: "asc" },
    });
  },

  countSuppliers(companyId: string) {
    return prisma.supplier.count({ where: { companyId } });
  },

  findSupplierByCode(companyId: string, code: string) {
    return prisma.supplier.findFirst({ where: { companyId, code }, select: { id: true } });
  },

  findSupplier(companyId: string, id: string, isActive?: boolean) {
    return prisma.supplier.findFirst({
      where: { id, companyId, ...(isActive === undefined ? {} : { isActive }) },
    });
  },

  findSupplierByBusinessName(companyId: string, businessName: string) {
    return prisma.supplier.findFirst({ where: { companyId, businessName } });
  },

  createSupplier(data: Prisma.SupplierCreateArgs) {
    return prisma.supplier.create(data);
  },

  updateSupplier(id: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({ where: { id }, data });
  },

  findSupplierWithPurchaseCount(companyId: string, id: string) {
    return prisma.supplier.findFirst({
      where: { id, companyId },
      include: { _count: { select: { purchases: true } } },
    });
  },

  deleteSupplier(id: string) {
    return prisma.supplier.delete({ where: { id } });
  },

  findWarehouse(companyId: string, id: string) {
    return prisma.warehouse.findFirst({ where: { id, companyId, isActive: true } });
  },

  findDefaultWarehouse(companyId: string) {
    return prisma.warehouse.findFirst({
      where: { companyId, isActive: true },
      orderBy: { isPrimary: "desc" },
    });
  },

  countActiveProducts(companyId: string, productIds: string[]) {
    return prisma.product.count({ where: { companyId, isActive: true, id: { in: productIds } } });
  },

  countPurchases(companyId: string) {
    return prisma.purchase.count({ where: { companyId } });
  },

  createPurchaseForReceipt(data: Prisma.PurchaseCreateArgs) {
    return prisma.purchase.create({ ...data, include: { items: true } });
  },

  findPurchaseSummary(companyId: string, id: string) {
    return prisma.purchase.findFirst({ where: { id, companyId }, include: purchaseListInclude });
  },

  updatePurchase(id: string, data: Prisma.PurchaseUpdateInput) {
    return prisma.purchase.update({ where: { id }, data, include: purchaseInclude });
  },

  findPurchase(companyId: string, id: string) {
    return prisma.purchase.findFirst({ where: { id, companyId } });
  },

  findPurchaseForReceipt(client: DatabaseClient, companyId: string, id: string) {
    return client.purchase.findFirst({ where: { id, companyId }, include: { items: true } });
  },

  createReceipt(client: DatabaseClient, data: Prisma.PurchaseReceiptCreateArgs) {
    return client.purchaseReceipt.create(data);
  },

  incrementReceivedQuantity(client: DatabaseClient, id: string, quantity: number) {
    return client.purchaseItem.update({
      where: { id },
      data: { receivedQuantity: { increment: quantity } },
    });
  },

  upsertBatch(client: DatabaseClient, data: Prisma.InventoryBatchUpsertArgs) {
    return client.inventoryBatch.upsert(data);
  },

  listPurchaseItems(client: DatabaseClient, purchaseId: string) {
    return client.purchaseItem.findMany({ where: { purchaseId } });
  },

  updatePurchaseStatus(client: DatabaseClient, id: string, status: PurchaseStatus) {
    return client.purchase.update({ where: { id }, data: { status } });
  },

  upsertPayable(
    client: DatabaseClient,
    purchaseId: string,
    originalAmount: Prisma.Decimal | number,
  ) {
    return client.accountsPayable.upsert({
      where: { purchaseId },
      update: {},
      create: { purchaseId, originalAmount },
    });
  },

  deletePayable(purchaseId: string) {
    return prisma.accountsPayable.deleteMany({ where: { purchaseId } });
  },

  updatePayable(
    client: DatabaseClient,
    id: string,
    data: Prisma.AccountsPayableUpdateArgs["data"],
  ) {
    return client.accountsPayable.update({ where: { id }, data, include: { payments: true } });
  },
};
