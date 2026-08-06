import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

export const productInclude = {
  category: true,
  brand: true,
  presentations: { orderBy: { unitsPerBase: "asc" } },
  barcodes: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
  stocks: { include: { warehouse: true } },
} satisfies Prisma.ProductInclude;

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export const productsRepository = {
  list(companyId: string, search?: string, isActive?: boolean) {
    return prisma.product.findMany({
      where: {
        companyId,
        ...(isActive === undefined ? {} : { isActive }),
        ...(search
          ? { OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
          ] }
          : {}),
      },
      include: productInclude,
      orderBy: { name: "asc" },
    });
  },

  findById(companyId: string, id: string) {
    return prisma.product.findFirst({ where: { id, companyId }, include: productInclude });
  },

  findBarcodeConflict(companyId: string, barcode: string, productId?: string) {
    return Promise.all([
      prisma.product.findFirst({ where: { companyId, barcode, ...(productId ? { id: { not: productId } } : {}) } }),
      prisma.productPresentation.findFirst({ where: { companyId, barcode } }),
    ]);
  },

  findCategory(companyId: string, id: string) {
    return prisma.productCategory.findFirst({ where: { id, companyId } });
  },

  upsertCategory(companyId: string, name: string, code: string) {
    return prisma.productCategory.upsert({
      where: { companyId_name: { companyId, name } },
      update: { isActive: true },
      create: { companyId, code, name },
    });
  },

  findBrand(companyId: string, id: string) {
    return prisma.productBrand.findFirst({ where: { id, companyId } });
  },

  upsertBrand(companyId: string, name: string) {
    return prisma.productBrand.upsert({
      where: { companyId_name: { companyId, name } },
      update: { isActive: true },
      create: { companyId, name },
    });
  },

  listCategoryCodes(companyId: string) {
    return prisma.productCategory.findMany({ where: { companyId }, select: { code: true } });
  },

  listMeasurementUnitCodes(companyId: string) {
    return prisma.measurementUnit.findMany({ where: { companyId }, select: { code: true } });
  },

  listSkus(companyId: string, prefix: string) {
    return prisma.product.findMany({ where: { companyId, sku: { startsWith: prefix } }, select: { sku: true } });
  },

  createProduct(client: DatabaseClient, data: Prisma.ProductCreateArgs) {
    return client.product.create(data as never);
  },

  updateProduct(client: DatabaseClient, data: Prisma.ProductUpdateArgs) {
    return client.product.update(data as never);
  },

  findProductById(client: DatabaseClient, id: string) {
    return client.product.findUniqueOrThrow({ where: { id }, include: productInclude });
  },

  deletePresentations(client: DatabaseClient, productId: string) {
    return client.productPresentation.deleteMany({ where: { productId } });
  },

  findPrimaryWarehouse(client: DatabaseClient, companyId: string) {
    return client.warehouse.findFirst({ where: { companyId, isActive: true }, orderBy: { isPrimary: "desc" } });
  },

  findStock(client: DatabaseClient, productId: string, warehouseId: string) {
    return client.inventoryStock.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
  },

  upsertStock(client: DatabaseClient, data: Prisma.InventoryStockUpsertArgs) {
    return client.inventoryStock.upsert(data as never);
  },

  createMovement(client: DatabaseClient, data: Prisma.InventoryMovementCreateArgs) {
    return client.inventoryMovement.create(data as never);
  },

  setProductStatus(id: string, isActive: boolean) {
    return prisma.product.update({ where: { id }, data: { isActive }, include: productInclude });
  },

  findProductUsage(id: string) {
    return prisma.product.findFirst({
      where: { id, OR: [{ saleItems: { some: {} } }, { purchaseItems: { some: {} } }, { movements: { some: {} } }] },
    });
  },

  deleteProduct(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  history(id: string) {
    return Promise.all([
      prisma.purchaseItem.findMany({ where: { productId: id }, include: { purchase: true }, orderBy: { purchase: { createdAt: "desc" } }, take: 50 }),
      prisma.saleItem.findMany({ where: { productId: id }, include: { sale: true }, orderBy: { sale: { createdAt: "desc" } }, take: 50 }),
      prisma.inventoryMovement.findMany({ where: { productId: id }, include: { warehouse: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
  },

  listCategories(companyId: string) {
    return prisma.productCategory.findMany({ where: { companyId }, orderBy: { name: "asc" } });
  },

  createCategory(companyId: string, code: string, name: string, description: string | null) {
    return prisma.productCategory.create({ data: { companyId, code, name, description } });
  },

  updateCategory(id: string, data: Prisma.ProductCategoryUpdateInput) {
    return prisma.productCategory.update({ where: { id }, data });
  },

  listBrands(companyId: string) {
    return prisma.productBrand.findMany({ where: { companyId }, orderBy: { name: "asc" } });
  },

  createBrand(companyId: string, name: string) {
    return prisma.productBrand.create({ data: { companyId, name } });
  },

  listMeasurementUnits(companyId: string) {
    return prisma.measurementUnit.findMany({ where: { companyId }, orderBy: { code: "asc" } });
  },

  findMeasurementUnit(companyId: string, id: string) {
    return prisma.measurementUnit.findFirst({ where: { id, companyId } });
  },

  createMeasurementUnit(companyId: string, code: string, abbreviation: string, name: string) {
    return prisma.measurementUnit.create({ data: { companyId, code, abbreviation, name } });
  },

  updateMeasurementUnit(id: string, data: Prisma.MeasurementUnitUpdateInput) {
    return prisma.measurementUnit.update({ where: { id }, data });
  },
};
