import { InventoryCountStatus, MovementType, WarehouseType, type Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export class InventoryError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

type MovementInput = { productId: string; warehouseId: string; type: MovementType; quantity: number; reason: string; documentRef?: string; batchId?: string };
const incoming = new Set<MovementType>(["IN", "INITIAL", "PURCHASE_RECEIPT", "CUSTOMER_RETURN", "TRANSFER_IN", "POSITIVE_ADJUSTMENT"]);
const outgoing = new Set<MovementType>(["OUT", "SALE_DISPATCH", "SUPPLIER_RETURN", "TRANSFER_OUT", "NEGATIVE_ADJUSTMENT", "DAMAGED", "EXPIRED"]);

const stockKey = (productId: string, warehouseId: string) => ({ productId_warehouseId: { productId, warehouseId } });

export const inventoryService = {
  listWarehouses(companyId: string) {
    return prisma.warehouse.findMany({ where: { companyId }, orderBy: [{ isPrimary: "desc" }, { name: "asc" }] });
  },
  async createWarehouse(companyId: string, input: { name: string; code?: string; type: WarehouseType; address?: string; isPrimary?: boolean }) {
    return prisma.$transaction(async (tx) => {
      if (input.isPrimary) await tx.warehouse.updateMany({ where: { companyId }, data: { isPrimary: false } });
      return tx.warehouse.create({ data: { companyId, name: input.name.trim(), code: input.code?.trim() || null, type: input.type, address: input.address?.trim() || null, isPrimary: input.isPrimary ?? false } });
    });
  },
  async listStocks(companyId: string) {
    return prisma.inventoryStock.findMany({ where: { warehouse: { companyId } }, include: { product: true, warehouse: true }, orderBy: [{ product: { name: "asc" } }, { warehouse: { name: "asc" } }] });
  },
  listMovements(companyId: string, productId?: string, warehouseId?: string) {
    return prisma.inventoryMovement.findMany({ where: { warehouse: { companyId }, ...(productId ? { productId } : {}), ...(warehouseId ? { warehouseId } : {}) }, include: { product: true, warehouse: true, createdBy: { select: { id: true, fullName: true } }, batch: true }, orderBy: { createdAt: "desc" }, take: 200 });
  },
  async recordMovement(companyId: string, userId: string, input: MovementInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    const [product, warehouse] = await Promise.all([
      client.product.findFirst({ where: { id: input.productId, companyId } }),
      client.warehouse.findFirst({ where: { id: input.warehouseId, companyId } }),
    ]);
    if (!product || !warehouse) throw new InventoryError("Producto o almacén no válido.", 404);
    const current = await client.inventoryStock.findUnique({ where: stockKey(input.productId, input.warehouseId) });
    const previous = Number(current?.quantity ?? 0);
    const delta = incoming.has(input.type) ? input.quantity : outgoing.has(input.type) ? -input.quantity : 0;
    if (input.quantity <= 0 || !Number.isFinite(input.quantity)) throw new InventoryError("La cantidad debe ser mayor a cero.");
    const resulting = previous + delta;
    if (resulting < 0) throw new InventoryError("Stock insuficiente para registrar la salida.", 409);
    const stock = current
      ? await client.inventoryStock.update({ where: { id: current.id }, data: { quantity: resulting } })
      : await client.inventoryStock.create({ data: { productId: input.productId, warehouseId: input.warehouseId, quantity: resulting, minimum: 0, reserved: 0 } });
    const movement = await client.inventoryMovement.create({ data: { productId: input.productId, warehouseId: input.warehouseId, type: input.type, quantity: input.quantity, quantityIn: delta > 0 ? input.quantity : 0, quantityOut: delta < 0 ? input.quantity : 0, previousStock: previous, resultingStock: resulting, documentRef: input.documentRef?.trim() || null, reason: input.reason.trim(), reference: input.reason.trim(), createdById: userId, batchId: input.batchId ?? null } });
    if (input.batchId) await client.inventoryBatch.update({ where: { id: input.batchId }, data: { quantity: { increment: delta } } });
    return { movement, stock };
  },
  async transfer(companyId: string, userId: string, input: { originWarehouseId: string; destinationWarehouseId: string; reference?: string; notes?: string; items: { productId: string; quantity: number }[] }) {
    if (input.originWarehouseId === input.destinationWarehouseId) throw new InventoryError("El almacén de origen y destino deben ser distintos.");
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.inventoryTransfer.create({ data: { companyId, originWarehouseId: input.originWarehouseId, destinationWarehouseId: input.destinationWarehouseId, reference: input.reference?.trim() || `TR-${Date.now()}`, notes: input.notes?.trim(), createdById: userId, items: { create: input.items } }, include: { items: true } });
      for (const item of input.items) {
        await this.recordMovement(companyId, userId, { productId: item.productId, warehouseId: input.originWarehouseId, type: MovementType.TRANSFER_OUT, quantity: item.quantity, reason: "Traslado entre almacenes", documentRef: transfer.reference ?? undefined }, tx);
        await this.recordMovement(companyId, userId, { productId: item.productId, warehouseId: input.destinationWarehouseId, type: MovementType.TRANSFER_IN, quantity: item.quantity, reason: "Traslado entre almacenes", documentRef: transfer.reference ?? undefined }, tx);
      }
      return transfer;
    });
  },
  createBatch(companyId: string, input: { productId: string; warehouseId: string; lotNumber: string; manufacturedAt?: Date; expiresAt?: Date; quantity?: number }) {
    return prisma.inventoryBatch.create({ data: { ...input, quantity: input.quantity ?? 0 } });
  },
  listBatches(companyId: string, warehouseId?: string) {
    return prisma.inventoryBatch.findMany({ where: { warehouse: { companyId }, ...(warehouseId ? { warehouseId } : {}) }, include: { product: true, warehouse: true }, orderBy: [{ expiresAt: "asc" }, { lotNumber: "asc" }] });
  },
  async createCount(companyId: string, userId: string, warehouseId: string, items: { productId: string; countedQuantity: number; reason?: string }[], notes?: string) {
    return prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.findFirst({ where: { id: warehouseId, companyId } });
      if (!warehouse) throw new InventoryError("Almacén no encontrado.", 404);
      const lines = await Promise.all(items.map(async (item) => {
        const stock = await tx.inventoryStock.findUnique({ where: stockKey(item.productId, warehouseId) });
        const systemQuantity = Number(stock?.quantity ?? 0);
        return { productId: item.productId, warehouseId, systemQuantity, countedQuantity: item.countedQuantity, difference: item.countedQuantity - systemQuantity, reason: item.reason?.trim() || null };
      }));
      return tx.inventoryCount.create({ data: { companyId, warehouseId, status: InventoryCountStatus.PENDING_APPROVAL, notes: notes?.trim(), createdById: userId, lines: { create: lines } }, include: { lines: true } });
    });
  },
  async approveCount(companyId: string, userId: string, countId: string) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.inventoryCount.findFirst({ where: { id: countId, companyId }, include: { lines: true } });
      if (!count) throw new InventoryError("Conteo no encontrado.", 404);
      if (count.status !== InventoryCountStatus.PENDING_APPROVAL) throw new InventoryError("El conteo no está pendiente de aprobación.", 409);
      for (const line of count.lines.filter((line) => Number(line.difference) !== 0)) {
        await this.recordMovement(companyId, userId, { productId: line.productId, warehouseId: line.warehouseId, type: Number(line.difference) > 0 ? MovementType.POSITIVE_ADJUSTMENT : MovementType.NEGATIVE_ADJUSTMENT, quantity: Math.abs(Number(line.difference)), reason: line.reason || "Ajuste aprobado por conteo físico", documentRef: `CON-${count.id}` }, tx);
      }
      return tx.inventoryCount.update({ where: { id: countId }, data: { status: InventoryCountStatus.APPROVED, approvedById: userId, approvedAt: new Date() } });
    });
  },
};
