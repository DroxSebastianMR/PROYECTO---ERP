import { PurchaseStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { inventoryService } from "../../inventory/inventory.service.js";
import { PurchaseError } from "../errors/purchases.errors.js";
import { purchasesRepository } from "../repositories/purchases.repository.js";
import type { PurchaseReceiptInput } from "../types/purchases.types.js";

export const purchaseReceiptService = {
  async receive(companyId: string, userId: string, id: string, input: PurchaseReceiptInput) {
    return prisma.$transaction(async (transaction) => {
      const purchase = await purchasesRepository.findPurchaseForReceipt(transaction, companyId, id);
      if (!purchase) throw new PurchaseError("Orden no encontrada.", 404);
      if (
        ([PurchaseStatus.CANCELLED, PurchaseStatus.PAID] as PurchaseStatus[]).includes(
          purchase.status,
        )
      ) {
        throw new PurchaseError("La orden no permite recepciones.", 409);
      }

      const warehouseId = input.warehouseId ?? purchase.warehouseId;
      if (!warehouseId) throw new PurchaseError("Debe indicar el almacén de ingreso.");
      const warehouse = await transaction.warehouse.findFirst({
        where: { id: warehouseId, companyId, isActive: true },
        select: { id: true },
      });
      if (!warehouse) throw new PurchaseError("Almacén inválido.", 404);
      const receipt = await purchasesRepository.createReceipt(transaction, {
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

        const acceptedQuantity = line.receivedQuantity - (line.damagedQuantity ?? 0);
        const pendingQuantity = Number(item.quantity) - Number(item.receivedQuantity);
        if (
          line.receivedQuantity <= 0 ||
          line.receivedQuantity > pendingQuantity ||
          acceptedQuantity < 0
        ) {
          throw new PurchaseError("La cantidad recibida no es válida.");
        }

        await purchasesRepository.incrementReceivedQuantity(
          transaction,
          item.id,
          line.receivedQuantity,
        );
        if (acceptedQuantity > 0) {
          await inventoryService.recordPurchaseReceipt(
            transaction,
            userId,
            {
              productId: item.productId,
              warehouseId,
              quantity: acceptedQuantity,
              documentRef: purchase.number,
            },
          );
        }
        if (line.lotNumber) {
          await purchasesRepository.upsertBatch(transaction, {
            where: {
              productId_warehouseId_lotNumber: {
                productId: item.productId,
                warehouseId,
                lotNumber: line.lotNumber,
              },
            },
            update: { quantity: { increment: acceptedQuantity }, expiresAt: line.expiresAt },
            create: {
              productId: item.productId,
              warehouseId,
              lotNumber: line.lotNumber,
              expiresAt: line.expiresAt,
              quantity: acceptedQuantity,
            },
          });
        }
      }

      const items = await purchasesRepository.listPurchaseItems(transaction, id);
      const completed = items.every(
        (item) => Number(item.receivedQuantity) >= Number(item.quantity),
      );
      await purchasesRepository.updatePurchaseStatus(
        transaction,
        id,
        completed ? PurchaseStatus.PENDING_PAYMENT : PurchaseStatus.PARTIALLY_RECEIVED,
      );
      if (completed) await purchasesRepository.upsertPayable(transaction, id, purchase.total);
      return receipt;
    }, { maxWait: 10_000, timeout: 30_000 });
  },
};
