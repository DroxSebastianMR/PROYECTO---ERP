import { prisma } from "../../../lib/prisma.js";
import { ProductCatalogError } from "../errors/products.errors.js";
import { productInclude, productsRepository } from "../repositories/products.repository.js";
import type { ProductInput, ProductPresentationInput } from "../types/products.types.js";
import { productClassificationService } from "./product-classification.service.js";
import { productIdentifiersService } from "./product-identifiers.service.js";
import { productStockService } from "./product-stock.service.js";
import { normalizeProductText, productValidationService } from "./product-validation.service.js";

const presentationsData = (companyId: string, presentations: ProductPresentationInput[]) =>
  presentations.map((presentation) => ({
    ...presentation,
    companyId,
    name: presentation.name.trim(),
    barcode: normalizeProductText(presentation.barcode),
  }));

const assertProductExists = async (companyId: string, id: string) => {
  const product = await productsRepository.findById(companyId, id);
  if (!product) throw new ProductCatalogError("Producto no encontrado.", 404);
  return product;
};

export const productCatalogService = {
  list: (companyId: string, search?: string, isActive?: boolean) =>
    productsRepository.list(companyId, search, isActive),

  getById: (companyId: string, id: string) => productsRepository.findById(companyId, id),

  async create(companyId: string, input: ProductInput) {
    await productValidationService.ensureBarcodeAvailable(companyId, input.barcode);
    await productValidationService.validatePresentations(companyId, input.presentations);
    const classification = await productClassificationService.resolve(companyId, input);
    const sku = await productIdentifiersService.nextSku(companyId, classification.categoryName);

    return prisma.$transaction(async (transaction) => {
      const product = await productsRepository.createProduct(transaction, {
        data: {
          companyId,
          sku,
          barcode: normalizeProductText(input.barcode),
          name: input.name.trim(),
          categoryId: classification.categoryId,
          brandId: classification.brandId,
          unit: input.unit,
          presentation: normalizeProductText(input.presentation),
          purchasePrice: input.purchasePrice,
          salePrice: input.salePrice,
          wholesalePrice: input.wholesalePrice,
          wholesaleMinQuantity: input.wholesaleMinQuantity,
          taxTreatment: input.taxTreatment,
          imageUrl: normalizeProductText(input.imageUrl),
          description: normalizeProductText(input.description),
          presentations: input.presentations?.length
            ? { create: presentationsData(companyId, input.presentations) }
            : undefined,
        },
        include: productInclude,
      });
      await productStockService.syncPrimaryStock(transaction, companyId, product.id, input.initialStock, input.minStock);
      return productsRepository.findProductById(transaction, product.id);
    }, { maxWait: 10_000, timeout: 20_000 });
  },

  async update(companyId: string, id: string, input: ProductInput) {
    const existing = await assertProductExists(companyId, id);
    await productValidationService.ensureBarcodeAvailable(companyId, input.barcode, id);
    await productValidationService.validatePresentations(companyId, input.presentations, id);
    const classification = await productClassificationService.resolve(companyId, input);

    return prisma.$transaction(async (transaction) => {
      if (input.presentations) await productsRepository.deletePresentations(transaction, id);
      const product = await productsRepository.updateProduct(transaction, {
        where: { id },
        data: {
          sku: existing.sku,
          barcode: normalizeProductText(input.barcode),
          name: input.name.trim(),
          categoryId: classification.categoryId,
          brandId: classification.brandId,
          unit: input.unit,
          presentation: normalizeProductText(input.presentation),
          purchasePrice: input.purchasePrice,
          salePrice: input.salePrice,
          wholesalePrice: input.wholesalePrice,
          wholesaleMinQuantity: input.wholesaleMinQuantity,
          taxTreatment: input.taxTreatment,
          imageUrl: normalizeProductText(input.imageUrl),
          description: normalizeProductText(input.description),
          ...(input.presentations
            ? { presentations: { create: presentationsData(companyId, input.presentations) } }
            : {}),
        },
        include: productInclude,
      });
      await productStockService.syncPrimaryStock(transaction, companyId, id, input.initialStock, input.minStock);
      return productsRepository.findProductById(transaction, product.id);
    }, { maxWait: 10_000, timeout: 20_000 });
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
};
