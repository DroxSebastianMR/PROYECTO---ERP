import { ProductCatalogError } from "../errors/products.errors.js";
import { productsRepository } from "../repositories/products.repository.js";
import type { ProductPresentationInput } from "../types/products.types.js";

export const normalizeProductText = (value?: string | null) => value?.trim() || null;

export const productValidationService = {
  async ensureBarcodeAvailable(companyId: string, barcode?: string | null, productId?: string) {
    const value = normalizeProductText(barcode);
    if (!value) return;
    const [product, presentation] = await productsRepository.findBarcodeConflict(
      companyId,
      value,
      productId,
    );
    if (product || presentation) {
      throw new ProductCatalogError("El código de barras ya está registrado.", 409);
    }
  },

  async validatePresentations(
    companyId: string,
    presentations?: ProductPresentationInput[],
    productId?: string,
  ) {
    const names = new Set<string>();
    for (const presentation of presentations ?? []) {
      const name = presentation.name.trim().toLowerCase();
      if (names.has(name)) throw new ProductCatalogError("No se pueden repetir presentaciones.");
      names.add(name);
      if (presentation.unitsPerBase <= 0) {
        throw new ProductCatalogError("La equivalencia debe ser mayor a cero.");
      }
      await this.ensureBarcodeAvailable(companyId, presentation.barcode, productId);
    }
  },
};
