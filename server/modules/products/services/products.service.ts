import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { ProductCatalogError } from "../errors/products.errors.js";
import { productInclude, productsRepository } from "../repositories/products.repository.js";
import type {
  CategoryUpdateInput,
  ClassificationInput,
  MeasurementUnitUpdateInput,
  ProductInput,
  ProductPresentationInput,
} from "../types/products.types.js";

type MasterCodeType = "CAT" | "UM";
type TransactionClient = Prisma.TransactionClient;

const normalized = (value?: string | null) => value?.trim() || null;

const createMasterCode = async (companyId: string, type: MasterCodeType) => {
  const records = type === "CAT"
    ? await productsRepository.listCategoryCodes(companyId)
    : await productsRepository.listMeasurementUnitCodes(companyId);
  const nextSequence = records.reduce(
    (maximum, record) => Math.max(maximum, Number(record.code?.replace(/\D/g, "") ?? "") || 0),
    0,
  ) + 1;
  return `${type}${String(nextSequence).padStart(3, "0")}`;
};

const createSkuPrefix = (categoryName: string) =>
  categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "PRD");

const createNextSku = async (companyId: string, categoryName: string) => {
  const prefix = createSkuPrefix(categoryName);
  const products = await productsRepository.listSkus(companyId, prefix);
  const nextSequence = products.reduce((maximum, product) => {
    const suffix = Number(product.sku.slice(prefix.length));
    return Number.isInteger(suffix) ? Math.max(maximum, suffix) : maximum;
  }, 0) + 1;
  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
};

const ensureBarcodeAvailable = async (companyId: string, barcode?: string | null, productId?: string) => {
  const value = normalized(barcode);
  if (!value) return;
  const [product, presentation] = await productsRepository.findBarcodeConflict(companyId, value, productId);
  if (product || presentation) {
    throw new ProductCatalogError("El código de barras ya está registrado.", 409);
  }
};

const validatePresentations = async (
  companyId: string,
  presentations?: ProductPresentationInput[],
  productId?: string,
) => {
  const names = new Set<string>();
  for (const presentation of presentations ?? []) {
    const name = presentation.name.trim().toLowerCase();
    if (names.has(name)) throw new ProductCatalogError("No se pueden repetir presentaciones.");
    names.add(name);
    if (presentation.unitsPerBase <= 0) {
      throw new ProductCatalogError("La equivalencia debe ser mayor a cero.");
    }
    await ensureBarcodeAvailable(companyId, presentation.barcode, productId);
  }
};

const resolveClassification = async (companyId: string, input: ClassificationInput) => {
  const categoryName = normalized(input.categoryName);
  const brandName = normalized(input.brandName);
  const category = input.categoryId
    ? await productsRepository.findCategory(companyId, input.categoryId)
    : categoryName
      ? await productsRepository.upsertCategory(companyId, categoryName, await createMasterCode(companyId, "CAT"))
      : null;
  if (input.categoryId && !category) {
    throw new ProductCatalogError("La categoría seleccionada no existe.", 404);
  }

  const brand = input.brandId
    ? await productsRepository.findBrand(companyId, input.brandId)
    : brandName
      ? await productsRepository.upsertBrand(companyId, brandName)
      : null;
  if (input.brandId && !brand) {
    throw new ProductCatalogError("La marca seleccionada no existe.", 404);
  }

  return { categoryId: category?.id ?? null, brandId: brand?.id ?? null, categoryName: category?.name ?? "PRD" };
};

const presentationData = (companyId: string, presentations: ProductPresentationInput[]) =>
  presentations.map((item) => ({
    ...item,
    companyId,
    name: item.name.trim(),
    barcode: normalized(item.barcode),
  }));

const syncPrimaryStock = async (
  transaction: TransactionClient,
  companyId: string,
  productId: string,
  initialStock?: number,
  minimum?: number,
) => {
  if (initialStock === undefined && minimum === undefined) return;
  const warehouse = await productsRepository.findPrimaryWarehouse(transaction, companyId);
  if (!warehouse) return;

  const current = await productsRepository.findStock(transaction, productId, warehouse.id);
  const quantity = initialStock ?? Number(current?.quantity ?? 0);
  const min = minimum ?? Number(current?.minimum ?? 0);
  await productsRepository.upsertStock(transaction, {
    where: { productId_warehouseId: { productId, warehouseId: warehouse.id } },
    create: { productId, warehouseId: warehouse.id, quantity, minimum: min, reserved: 0 },
    update: { quantity, minimum: min },
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
};

const assertProductExists = async (companyId: string, id: string) => {
  const product = await productsRepository.findById(companyId, id);
  if (!product) throw new ProductCatalogError("Producto no encontrado.", 404);
  return product;
};

export const productsService = {
  list: (companyId: string, search?: string, isActive?: boolean) =>
    productsRepository.list(companyId, search, isActive),

  getById: (companyId: string, id: string) => productsRepository.findById(companyId, id),

  async create(companyId: string, input: ProductInput) {
    await ensureBarcodeAvailable(companyId, input.barcode);
    await validatePresentations(companyId, input.presentations);
    const { categoryName, ...classification } = await resolveClassification(companyId, input);
    const sku = await createNextSku(companyId, categoryName);

    return prismaTransaction(async (transaction) => {
      const product = await productsRepository.createProduct(transaction, {
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
            ? { create: presentationData(companyId, input.presentations) }
            : undefined,
        },
        include: productInclude,
      });
      await syncPrimaryStock(transaction, companyId, product.id, input.initialStock, input.minStock);
      return productsRepository.findProductById(transaction, product.id);
    });
  },

  async update(companyId: string, id: string, input: ProductInput) {
    const existing = await assertProductExists(companyId, id);
    await ensureBarcodeAvailable(companyId, input.barcode, id);
    await validatePresentations(companyId, input.presentations, id);
    const { categoryName: _categoryName, ...classification } = await resolveClassification(companyId, input);

    return prismaTransaction(async (transaction) => {
      if (input.presentations) await productsRepository.deletePresentations(transaction, id);
      const product = await productsRepository.updateProduct(transaction, {
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
            ? { presentations: { create: presentationData(companyId, input.presentations) } }
            : {}),
        },
        include: productInclude,
      });
      await syncPrimaryStock(transaction, companyId, id, input.initialStock, input.minStock);
      return productsRepository.findProductById(transaction, product.id);
    });
  },

  async setStatus(companyId: string, id: string, isActive: boolean) {
    await assertProductExists(companyId, id);
    return productsRepository.setProductStatus(id, isActive);
  },

  async remove(companyId: string, id: string) {
    await assertProductExists(companyId, id);
    if (await productsRepository.findProductUsage(id)) {
      return productsRepository.setProductStatus(id, false);
    }
    await productsRepository.deleteProduct(id);
    return null;
  },

  async history(companyId: string, id: string) {
    await assertProductExists(companyId, id);
    const [purchases, sales, movements] = await productsRepository.history(id);
    return { purchases, sales, movements };
  },

  listCategories: (companyId: string) => productsRepository.listCategories(companyId),

  async createCategory(companyId: string, name: string, description?: string) {
    return productsRepository.createCategory(
      companyId,
      await createMasterCode(companyId, "CAT"),
      name.trim(),
      normalized(description),
    );
  },

  async updateCategory(companyId: string, id: string, input: CategoryUpdateInput) {
    if (!await productsRepository.findCategory(companyId, id)) {
      throw new ProductCatalogError("Categoría no encontrada.", 404);
    }
    return productsRepository.updateCategory(id, {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    });
  },

  listBrands: (companyId: string) => productsRepository.listBrands(companyId),
  createBrand: (companyId: string, name: string) => productsRepository.createBrand(companyId, name.trim()),
  listMeasurementUnits: (companyId: string) => productsRepository.listMeasurementUnits(companyId),

  async createMeasurementUnit(companyId: string, code: string, name: string) {
    return productsRepository.createMeasurementUnit(
      companyId,
      await createMasterCode(companyId, "UM"),
      code.trim().toUpperCase(),
      name.trim(),
    );
  },

  async updateMeasurementUnit(companyId: string, id: string, input: MeasurementUnitUpdateInput) {
    if (!await productsRepository.findMeasurementUnit(companyId, id)) {
      throw new ProductCatalogError("Unidad de medida no encontrada.", 404);
    }
    return productsRepository.updateMeasurementUnit(id, {
      ...(input.code ? { abbreviation: input.code.trim().toUpperCase() } : {}),
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    });
  },
};

const prismaTransaction = <Result>(callback: (transaction: TransactionClient) => Promise<Result>) =>
  prisma.$transaction(callback, { maxWait: 10_000, timeout: 20_000 });
