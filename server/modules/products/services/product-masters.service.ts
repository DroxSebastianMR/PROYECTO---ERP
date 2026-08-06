import { ProductCatalogError } from "../errors/products.errors.js";
import { productsRepository } from "../repositories/products.repository.js";
import type { CategoryUpdateInput, MeasurementUnitUpdateInput } from "../types/products.types.js";
import { productIdentifiersService } from "./product-identifiers.service.js";
import { normalizeProductText } from "./product-validation.service.js";

export const productMastersService = {
  listCategories: (companyId: string) => productsRepository.listCategories(companyId),

  async createCategory(companyId: string, name: string, description?: string) {
    return productsRepository.createCategory(
      companyId,
      await productIdentifiersService.nextMasterCode(companyId, "CAT"),
      name.trim(),
      normalizeProductText(description),
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
      await productIdentifiersService.nextMasterCode(companyId, "UM"),
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
