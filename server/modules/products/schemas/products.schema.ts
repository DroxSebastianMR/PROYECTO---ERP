import { z } from "zod";

export const productIdSchema = z.string().uuid();

const presentationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(20),
  unitsPerBase: z.coerce.number().positive(),
  barcode: z.string().trim().max(80).nullable().optional(),
  salePrice: z.coerce.number().nonnegative().nullable().optional(),
  wholesalePrice: z.coerce.number().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const productSchema = z.object({
  sku: z.string().trim().min(1).max(80).optional(),
  barcode: z.string().trim().max(80).nullable().optional(),
  name: z.string().trim().min(1).max(180),
  categoryId: z.string().uuid().nullable().optional(),
  categoryName: z.string().trim().max(100).nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  brandName: z.string().trim().max(100).nullable().optional(),
  unit: z.string().trim().min(1).max(20),
  presentation: z.string().trim().max(160).nullable().optional(),
  purchasePrice: z.coerce.number().nonnegative().nullable().optional(),
  salePrice: z.coerce.number().nonnegative(),
  wholesalePrice: z.coerce.number().nonnegative().nullable().optional(),
  wholesaleMinQuantity: z.coerce.number().positive().nullable().optional(),
  // Catalog records are taxable by default. The product form exposes this as
  // the "Afecto a IGV" switch; unchecked products are persisted as UNAFFECTED.
  taxTreatment: z.enum(["TAXED", "EXONERATED", "UNAFFECTED"]).default("TAXED"),
  imageUrl: z.string().url().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  initialStock: z.coerce.number().nonnegative().optional(),
  minStock: z.coerce.number().nonnegative().optional(),
  presentations: z.array(presentationSchema).max(30).optional(),
});

// A new catalog record must be traceable to the factory barcode that is read
// with the scanner. Updates keep the base schema for legacy data migrations.
export const createProductSchema = productSchema.refine(
  (product) => Boolean(product.barcode?.trim()),
  { path: ["barcode"], message: "El código de barras de fábrica es obligatorio." },
);

export const classificationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

export const measurementUnitSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(100),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const measurementUnitUpdateSchema = z.object({
  code: z.string().trim().min(1).max(20).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const productStatusSchema = z.object({ isActive: z.boolean() });

export const productListQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export const barcodeAvailabilityQuerySchema = z.object({
  barcode: z.string().trim().min(3).max(80),
  excludeProductId: z.string().uuid().optional(),
});
