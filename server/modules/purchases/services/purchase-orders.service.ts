import { PaymentMethod, PurchaseStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { PurchaseError } from "../errors/purchases.errors.js";
import { purchasesRepository } from "../repositories/purchases.repository.js";
import type { PurchaseInput, PurchaseUpdateInput } from "../types/purchases.types.js";
import { purchaseReceiptService } from "./purchase-receipts.service.js";
import { suppliersService } from "./suppliers.service.js";

const calculateTotals = (items: PurchaseInput["items"]) =>
  items.reduce(
    (accumulator, item) => {
      const base = item.quantity * item.unitCost - (item.discount ?? 0);
      const tax = (base * (item.taxRate ?? 18)) / 100;
      return { subtotal: accumulator.subtotal + base, tax: accumulator.tax + tax };
    },
    { subtotal: 0, tax: 0 },
  );

const resolveSupplier = async (companyId: string, input: PurchaseInput) => {
  if (input.supplierId) return purchasesRepository.findSupplier(companyId, input.supplierId, true);
  if (!input.supplierName?.trim()) return null;
  const businessName = input.supplierName.trim();
  return (
    (await purchasesRepository.findSupplierByBusinessName(companyId, businessName)) ??
    suppliersService.create(companyId, { businessName })
  );
};

const resolveWarehouse = (companyId: string, warehouseId?: string) =>
  warehouseId
    ? purchasesRepository.findWarehouse(companyId, warehouseId)
    : purchasesRepository.findDefaultWarehouse(companyId);

export const purchaseOrdersService = {
  list: (companyId: string) => purchasesRepository.list(companyId),

  getById: (companyId: string, id: string) => purchasesRepository.findById(companyId, id),

  async create(companyId: string, userId: string, input: PurchaseInput) {
    const [supplier, warehouse] = await Promise.all([
      resolveSupplier(companyId, input),
      resolveWarehouse(companyId, input.warehouseId),
    ]);
    if (!supplier || !warehouse) throw new PurchaseError("Proveedor o almacén inválido.", 404);

    const productIds = input.items.map((item) => item.productId);
    const activeProducts = await purchasesRepository.countActiveProducts(companyId, productIds);
    if (activeProducts !== new Set(productIds).size) {
      throw new PurchaseError("Uno o más productos no pertenecen a la empresa.", 404);
    }

    const totals = calculateTotals(input.items);
    const number = `OC-${String((await purchasesRepository.countPurchases(companyId)) + 1).padStart(6, "0")}`;
    const purchase = await purchasesRepository.createPurchaseForReceipt({
      data: {
        companyId,
        number,
        supplierId: supplier.id,
        supplierName: supplier.businessName,
        warehouseId: warehouse.id,
        expectedDeliveryAt: input.expectedDeliveryAt,
        purchasedAt: input.purchasedAt,
        warehouseEntryAt: input.warehouseEntryAt,
        notes: input.notes?.trim() || null,
        paymentMethod: input.paymentMethod ?? PaymentMethod.CREDIT,
        currency: input.currency ?? "PEN",
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        total: totals.subtotal + totals.tax,
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
    });

    await purchaseReceiptService.receive(companyId, userId, purchase.id, {
      warehouseId: warehouse.id,
      notes: "Recepción automática al registrar la compra.",
      lines: purchase.items.map((item) => ({
        purchaseItemId: item.id,
        receivedQuantity: Number(item.quantity),
      })),
    });
    await prisma.$transaction([
      purchasesRepository.deletePayable(purchase.id),
      purchasesRepository.updatePurchase(purchase.id, { status: PurchaseStatus.RECEIVED }),
    ]);

    const receivedPurchase = await purchasesRepository.findPurchaseSummary(companyId, purchase.id);
    if (!receivedPurchase)
      throw new PurchaseError("No se pudo recuperar la compra registrada.", 500);
    return receivedPurchase;
  },

  async order(companyId: string, id: string) {
    const purchase = await purchasesRepository.findById(companyId, id);
    if (!purchase) throw new PurchaseError("Orden no encontrada.", 404);
    if (purchase.status !== PurchaseStatus.DRAFT)
      throw new PurchaseError("Solo se pueden ordenar compras en borrador.", 409);
    return purchasesRepository.updatePurchase(id, { status: PurchaseStatus.ORDERED });
  },

  async update(companyId: string, id: string, input: PurchaseUpdateInput) {
    const purchase = await purchasesRepository.findPurchase(companyId, id);
    if (!purchase) throw new PurchaseError("Compra no encontrada.", 404);
    if (purchase.status === PurchaseStatus.CANCELLED)
      throw new PurchaseError("No se puede editar una compra anulada.", 409);

    const supplier = input.supplierId
      ? await purchasesRepository.findSupplier(companyId, input.supplierId, true)
      : null;
    if (input.supplierId && !supplier) throw new PurchaseError("Proveedor inválido.", 404);
    return purchasesRepository.updatePurchase(id, {
      ...(supplier ? { supplierId: supplier.id, supplierName: supplier.businessName } : {}),
      ...(input.purchasedAt ? { purchasedAt: input.purchasedAt } : {}),
      ...(input.warehouseEntryAt ? { warehouseEntryAt: input.warehouseEntryAt } : {}),
      ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
      ...(input.supplierDocumentNumber?.trim()
        ? {
            document: {
              upsert: {
                create: {
                  type: "INVOICE",
                  number: input.supplierDocumentNumber.trim(),
                  issuedAt: input.purchasedAt ?? purchase.purchasedAt ?? new Date(),
                },
                update: {
                  number: input.supplierDocumentNumber.trim(),
                  ...(input.purchasedAt ? { issuedAt: input.purchasedAt } : {}),
                },
              },
            },
          }
        : {}),
    });
  },
};
