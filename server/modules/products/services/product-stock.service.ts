import type { Prisma } from "@prisma/client";
import { productsRepository } from "../repositories/products.repository.js";

export const productStockService = {
  async syncPrimaryStock(
    transaction: Prisma.TransactionClient,
    companyId: string,
    productId: string,
    initialStock?: number,
    minimum?: number,
  ) {
    if (initialStock === undefined && minimum === undefined) return;
    const warehouse = await productsRepository.findPrimaryWarehouse(transaction, companyId);
    if (!warehouse) return;

    const current = await productsRepository.findStock(transaction, productId, warehouse.id);
    const quantity = initialStock ?? Number(current?.quantity ?? 0);
    const minimumStock = minimum ?? Number(current?.minimum ?? 0);
    await productsRepository.upsertStock(transaction, {
      where: { productId_warehouseId: { productId, warehouseId: warehouse.id } },
      create: {
        productId,
        warehouseId: warehouse.id,
        quantity,
        minimum: minimumStock,
        reserved: 0,
      },
      update: { quantity, minimum: minimumStock },
    });

    const delta = quantity - Number(current?.quantity ?? 0);
    if (!delta) return;
    await productsRepository.createMovement(transaction, {
      data: {
        productId,
        warehouseId: warehouse.id,
        type: delta > 0 ? "INITIAL" : "NEGATIVE_ADJUSTMENT",
        quantity: Math.abs(delta),
        quantityIn: delta > 0 ? delta : 0,
        quantityOut: delta < 0 ? Math.abs(delta) : 0,
        previousStock: Number(current?.quantity ?? 0),
        resultingStock: quantity,
        reason: "Actualización de stock desde el catálogo de productos",
        reference: "PRODUCT-CATALOG",
      },
    });
  },
};
