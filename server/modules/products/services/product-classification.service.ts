import { ProductCatalogError } from "../errors/products.errors.js";
import { productsRepository } from "../repositories/products.repository.js";
import type { ClassificationInput } from "../types/products.types.js";
import { productIdentifiersService } from "./product-identifiers.service.js";
import { normalizeProductText } from "./product-validation.service.js";

export const productClassificationService = {
  async resolve(companyId: string, input: ClassificationInput) {
    const categoryName = normalizeProductText(input.categoryName);
    const brandName = normalizeProductText(input.brandName);
    const category = input.categoryId
      ? await productsRepository.findCategory(companyId, input.categoryId)
      : categoryName
        ? await productsRepository.upsertCategory(
          companyId,
          categoryName,
          await productIdentifiersService.nextMasterCode(companyId, "CAT"),
        )
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

    return {
      categoryId: category?.id ?? null,
      brandId: brand?.id ?? null,
      categoryName: category?.name ?? "PRD",
    };
  },
};
