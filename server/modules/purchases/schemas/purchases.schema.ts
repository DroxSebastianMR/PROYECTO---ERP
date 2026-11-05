import { z } from "zod";

export const purchaseIdSchema = z.string().uuid();

const paymentMethodSchema = z.enum(["CASH", "BANK_TRANSFER", "CARD", "YAPE_PLIN", "CREDIT"]);

export const supplierSchema = z.object({
  ruc: z.string().trim().min(8).max(15).optional(),
  businessName: z.string().trim().min(2).max(180),
  tradeName: z.string().trim().max(180).optional(),
  address: z.string().trim().max(250).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().email().optional(),
  contactName: z.string().trim().max(120).optional(),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
});

export const supplierUpdateSchema = supplierSchema
  .extend({ isActive: z.boolean().optional() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Indica un cambio para guardar." });

export const purchaseSchema = z
  .object({
    supplierId: purchaseIdSchema.optional(),
    supplierName: z.string().trim().min(2).optional(),
    warehouseId: purchaseIdSchema.optional(),
    expectedDeliveryAt: z.coerce.date().optional(),
    purchasedAt: z.coerce.date().optional(),
    warehouseEntryAt: z.coerce.date().optional(),
    supplierDocumentNumber: z.string().trim().min(3).max(80).optional(),
    notes: z.string().trim().max(1000).optional(),
    paymentMethod: paymentMethodSchema.optional(),
    currency: z.string().length(3).optional(),
    items: z
      .array(
        z.object({
          productId: purchaseIdSchema,
          quantity: z.coerce.number().int().positive(),
          unitCost: z.coerce.number().nonnegative(),
          presentationName: z.string().trim().max(160).optional(),
          unit: z.string().trim().max(30).optional(),
          discount: z.coerce.number().nonnegative().optional(),
          taxRate: z.coerce.number().min(0).max(100).optional(),
        }),
      )
      .min(1),
  })
  .refine((input) => Boolean(input.supplierId || input.supplierName), {
    message: "Selecciona o registra un proveedor.",
  });

export const purchaseUpdateSchema = z
  .object({
    supplierId: purchaseIdSchema.optional(),
    purchasedAt: z.coerce.date().optional(),
    warehouseEntryAt: z.coerce.date().optional(),
    supplierDocumentNumber: z.string().trim().min(3).max(80).optional(),
    notes: z.string().trim().max(1000).optional(),
    paymentMethod: paymentMethodSchema.optional(),
    currency: z.string().length(3).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, { message: "Indica datos para actualizar." });

export const purchaseReceiptSchema = z.object({
  warehouseId: purchaseIdSchema.optional(),
  notes: z.string().max(500).optional(),
  lines: z
    .array(
      z.object({
        purchaseItemId: purchaseIdSchema,
        receivedQuantity: z.coerce.number().int().positive(),
        damagedQuantity: z.coerce.number().int().nonnegative().optional(),
        lotNumber: z.string().max(80).optional(),
        expiresAt: z.coerce.date().optional(),
      }),
    )
    .min(1),
});

export const purchasePaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: paymentMethodSchema,
  reference: z.string().max(100).optional(),
});
