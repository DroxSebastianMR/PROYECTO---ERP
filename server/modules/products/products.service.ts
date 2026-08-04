import { Prisma, TaxTreatment } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

type PresentationInput = {
  id?: string;
  name: string;
  unit: string;
  unitsPerBase: number;
  barcode?: string | null;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  isActive?: boolean;
};

export type ProductInput = {
  sku?: string;
  barcode?: string | null;
  name: string;
  categoryId?: string | null;
  categoryName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  unit: string;
  presentation?: string | null;
  purchasePrice?: number | null;
  salePrice: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  taxTreatment: TaxTreatment;
  imageUrl?: string | null;
  description?: string | null;
  initialStock?: number;
  minStock?: number;
  presentations?: PresentationInput[];
};

export class ProductCatalogError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

const productInclude = {
  category: true,
  brand: true,
  presentations: { orderBy: { unitsPerBase: "asc" } },
  barcodes: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
  stocks: { include: { warehouse: true } },
} satisfies Prisma.ProductInclude;

const normalized = (value?: string | null) => value?.trim() || null;
const nextMasterCode = async (companyId: string, type: "CAT" | "UM") => {
  const values = type === "CAT"
    ? await prisma.productCategory.findMany({ where: { companyId }, select: { code: true } })
    : await prisma.measurementUnit.findMany({ where: { companyId }, select: { code: true } });
  const next = values.reduce((max, item) => Math.max(max, Number(item.code?.replace(/\D/g, "")) || 0), 0) + 1;
  return `${type}${String(next).padStart(3, "0")}`;
};
const skuPrefix = (categoryName: string) =>
  categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "PRD");

const nextSku = async (companyId: string, categoryName: string) => {
  const prefix = skuPrefix(categoryName);
  const products = await prisma.product.findMany({
    where: { companyId, sku: { startsWith: prefix } },
    select: { sku: true },
  });
  const next = products.reduce((maximum, product) => {
    const suffix = Number(product.sku.slice(prefix.length));
    return Number.isInteger(suffix) ? Math.max(maximum, suffix) : maximum;
  }, 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};

const ensureBarcodeAvailable = async (
  companyId: string,
  barcode: string | null | undefined,
  productId?: string,
) => {
  if (!barcode) return;
  const [product, presentation] = await Promise.all([
    prisma.product.findFirst({
      where: { companyId, barcode, ...(productId ? { id: { not: productId } } : {}) },
    }),
    prisma.productPresentation.findFirst({ where: { companyId, barcode } }),
  ]);
  if (product || presentation)
    throw new ProductCatalogError("El código de barras ya está registrado.", 409);
};

const resolveClassification = async (
  companyId: string,
  categoryId: string | null | undefined,
  categoryName: string | null | undefined,
  brandId: string | null | undefined,
  brandName: string | null | undefined,
) => {
  const category = categoryId
    ? await prisma.productCategory.findFirst({ where: { id: categoryId, companyId } })
    : normalized(categoryName)
      ? await prisma.productCategory.upsert({
          where: { companyId_name: { companyId, name: normalized(categoryName)! } },
          update: { isActive: true },
          create: { companyId, code: await nextMasterCode(companyId, "CAT"), name: normalized(categoryName)! },
        })
      : null;
  if (categoryId && !category)
    throw new ProductCatalogError("La categoría seleccionada no existe.", 404);

  const brand = brandId
    ? await prisma.productBrand.findFirst({ where: { id: brandId, companyId } })
    : normalized(brandName)
      ? await prisma.productBrand.upsert({
          where: { companyId_name: { companyId, name: normalized(brandName)! } },
          update: { isActive: true },
          create: { companyId, name: normalized(brandName)! },
        })
      : null;
  if (brandId && !brand) throw new ProductCatalogError("La marca seleccionada no existe.", 404);
  return {
    categoryId: category?.id ?? null,
    brandId: brand?.id ?? null,
    categoryName: category?.name ?? "PRD",
  };
};

const validatePresentations = async (
  companyId: string,
  presentations: PresentationInput[] | undefined,
  productId?: string,
) => {
  const names = new Set<string>();
  for (const item of presentations ?? []) {
    const name = item.name.trim().toLowerCase();
    if (names.has(name)) throw new ProductCatalogError("No se pueden repetir presentaciones.");
    names.add(name);
    if (item.unitsPerBase <= 0)
      throw new ProductCatalogError("La equivalencia debe ser mayor a cero.");
    if (item.barcode) await ensureBarcodeAvailable(companyId, item.barcode.trim(), productId);
  }
};

const syncPrimaryStock = async (
  client: Prisma.TransactionClient,
  companyId: string,
  productId: string,
  initialStock: number | undefined,
  minimum: number | undefined,
) => {
  if (initialStock === undefined && minimum === undefined) return;
  const warehouse = await client.warehouse.findFirst({ where: { companyId, isActive: true }, orderBy: { isPrimary: "desc" } });
  if (!warehouse) return;
  const current = await client.inventoryStock.findUnique({ where: { productId_warehouseId: { productId, warehouseId: warehouse.id } } });
  const quantity = initialStock ?? Number(current?.quantity ?? 0);
  const min = minimum ?? Number(current?.minimum ?? 0);
  await client.inventoryStock.upsert({
    where: { productId_warehouseId: { productId, warehouseId: warehouse.id } },
    create: { productId, warehouseId: warehouse.id, quantity, minimum: min, reserved: 0 },
    update: { quantity, minimum: min },
  });
  const delta = quantity - Number(current?.quantity ?? 0);
  if (delta !== 0) await client.inventoryMovement.create({ data: { productId, warehouseId: warehouse.id, type: delta > 0 ? "INITIAL" : "NEGATIVE_ADJUSTMENT", quantity: Math.abs(delta), quantityIn: delta > 0 ? delta : 0, quantityOut: delta < 0 ? Math.abs(delta) : 0, previousStock: Number(current?.quantity ?? 0), resultingStock: quantity, reason: "Actualización de stock desde el catálogo de productos", reference: "PRODUCT-CATALOG" } });
};

export const productsService = {
  list(companyId: string, search?: string, isActive?: boolean) {
    return prisma.product.findMany({
      where: {
        companyId,
        ...(isActive === undefined ? {} : { isActive }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: productInclude,
      orderBy: { name: "asc" },
    });
  },

  getById(companyId: string, id: string) {
    return prisma.product.findFirst({ where: { id, companyId }, include: productInclude });
  },

  async create(companyId: string, input: ProductInput) {
    await ensureBarcodeAvailable(companyId, normalized(input.barcode));
    await validatePresentations(companyId, input.presentations);
    const { categoryName, ...classification } = await resolveClassification(
      companyId,
      input.categoryId,
      input.categoryName,
      input.brandId,
      input.brandName,
    );
    const sku = await nextSku(companyId, categoryName);

    return prisma.$transaction(async (transaction) => {
      const product = await transaction.product.create({
      data: {
        companyId,
        sku,
        barcode: normalized(input.barcode),
        name: input.name.trim(),
        ...classification,
        unit: input.unit,
        presentation: normalized(input.presentation),
        purchasePrice: input.purchasePrice,
        salePrice: input.salePrice,
        wholesalePrice: input.wholesalePrice,
        wholesaleMinQuantity: input.wholesaleMinQuantity,
        taxTreatment: input.taxTreatment,
        imageUrl: normalized(input.imageUrl),
        description: normalized(input.description),
        presentations: input.presentations?.length
          ? {
              create: input.presentations.map((item) => ({
                ...item,
                companyId,
                name: item.name.trim(),
                barcode: normalized(item.barcode),
              })),
            }
          : undefined,
      },
        include: productInclude,
      });
      await syncPrimaryStock(transaction, companyId, product.id, input.initialStock, input.minStock);
      return transaction.product.findUniqueOrThrow({ where: { id: product.id }, include: productInclude });
    }, { maxWait: 10_000, timeout: 20_000 });
  },

  async update(companyId: string, id: string, input: ProductInput) {
    const existing = await this.getById(companyId, id);
    if (!existing) throw new ProductCatalogError("Producto no encontrado.", 404);
    await ensureBarcodeAvailable(companyId, normalized(input.barcode), id);
    await validatePresentations(companyId, input.presentations, id);
    const resolvedClassification = await resolveClassification(
      companyId,
      input.categoryId,
      input.categoryName,
      input.brandId,
      input.brandName,
    );
    const classification = {
      categoryId: resolvedClassification.categoryId,
      brandId: resolvedClassification.brandId,
    };

    return prisma.$transaction(async (transaction) => {
      if (input.presentations)
        await transaction.productPresentation.deleteMany({ where: { productId: id } });
      const product = await transaction.product.update({
        where: { id },
        data: {
          sku: existing.sku,
          barcode: normalized(input.barcode),
          name: input.name.trim(),
          ...classification,
          unit: input.unit,
          presentation: normalized(input.presentation),
          purchasePrice: input.purchasePrice,
          salePrice: input.salePrice,
          wholesalePrice: input.wholesalePrice,
          wholesaleMinQuantity: input.wholesaleMinQuantity,
          taxTreatment: input.taxTreatment,
          imageUrl: normalized(input.imageUrl),
          description: normalized(input.description),
          ...(input.presentations
            ? {
                presentations: {
                  create: input.presentations.map((item) => ({
                    ...item,
                    companyId,
                    name: item.name.trim(),
                    barcode: normalized(item.barcode),
                  })),
                },
              }
            : {}),
        },
        include: productInclude,
      });
      await syncPrimaryStock(transaction, companyId, id, input.initialStock, input.minStock);
      return transaction.product.findUniqueOrThrow({ where: { id: product.id }, include: productInclude });
    }, { maxWait: 10_000, timeout: 20_000 });
  },

  async setStatus(companyId: string, id: string, isActive: boolean) {
    const product = await this.getById(companyId, id);
    if (!product) throw new ProductCatalogError("Producto no encontrado.", 404);
    return prisma.product.update({ where: { id }, data: { isActive }, include: productInclude });
  },

  async remove(companyId: string, id: string) {
    const product = await this.getById(companyId, id);
    if (!product) throw new ProductCatalogError("Producto no encontrado.", 404);
    const usage = await prisma.product.findFirst({
      where: {
        id,
        OR: [
          { saleItems: { some: {} } },
          { purchaseItems: { some: {} } },
          { movements: { some: {} } },
        ],
      },
    });
    if (usage)
      return prisma.product.update({
        where: { id },
        data: { isActive: false },
        include: productInclude,
      });
    await prisma.product.delete({ where: { id } });
    return null;
  },

  async history(companyId: string, id: string) {
    const product = await this.getById(companyId, id);
    if (!product) throw new ProductCatalogError("Producto no encontrado.", 404);
    const [purchases, sales, movements] = await Promise.all([
      prisma.purchaseItem.findMany({
        where: { productId: id },
        include: { purchase: true },
        orderBy: { purchase: { createdAt: "desc" } },
        take: 50,
      }),
      prisma.saleItem.findMany({
        where: { productId: id },
        include: { sale: true },
        orderBy: { sale: { createdAt: "desc" } },
        take: 50,
      }),
      prisma.inventoryMovement.findMany({
        where: { productId: id },
        include: { warehouse: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);
    return { purchases, sales, movements };
  },

  listCategories(companyId: string) {
    return prisma.productCategory.findMany({ where: { companyId }, orderBy: { name: "asc" } });
  },
  async createCategory(companyId: string, name: string, description?: string) {
    return prisma.productCategory.create({
      data: { companyId, code: await nextMasterCode(companyId, "CAT"), name: name.trim(), description: normalized(description) },
    });
  },
  async updateCategory(companyId: string, id: string, input: { name?: string; isActive?: boolean }) {
    const category = await prisma.productCategory.findFirst({ where: { id, companyId } });
    if (!category) throw new ProductCatalogError("Categoría no encontrada.", 404);
    return prisma.productCategory.update({ where: { id }, data: { ...(input.name ? { name: input.name.trim() } : {}), ...(input.isActive === undefined ? {} : { isActive: input.isActive }) } });
  },
  listBrands(companyId: string) {
    return prisma.productBrand.findMany({ where: { companyId }, orderBy: { name: "asc" } });
  },
  createBrand(companyId: string, name: string) {
    return prisma.productBrand.create({ data: { companyId, name: name.trim() } });
  },
  listMeasurementUnits(companyId: string) {
    return prisma.measurementUnit.findMany({
      where: { companyId },
      orderBy: { code: "asc" },
    });
  },
  async createMeasurementUnit(companyId: string, code: string, name: string) {
    return prisma.measurementUnit.create({
      data: { companyId, code: await nextMasterCode(companyId, "UM"), abbreviation: code.trim().toUpperCase(), name: name.trim() },
    });
  },
  async updateMeasurementUnit(companyId: string, id: string, input: { code?: string; name?: string; isActive?: boolean }) {
    const unit = await prisma.measurementUnit.findFirst({ where: { id, companyId } });
    if (!unit) throw new ProductCatalogError("Unidad de medida no encontrada.", 404);
    return prisma.measurementUnit.update({ where: { id }, data: { ...(input.code ? { abbreviation: input.code.trim().toUpperCase() } : {}), ...(input.name ? { name: input.name.trim() } : {}), ...(input.isActive === undefined ? {} : { isActive: input.isActive }) } });
  },
};
