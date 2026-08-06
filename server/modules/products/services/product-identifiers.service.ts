import { productsRepository } from "../repositories/products.repository.js";

type MasterCodeType = "CAT" | "UM";

const skuPrefix = (categoryName: string) =>
  categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "PRD");

export const productIdentifiersService = {
  async nextMasterCode(companyId: string, type: MasterCodeType) {
    const records = type === "CAT"
      ? await productsRepository.listCategoryCodes(companyId)
      : await productsRepository.listMeasurementUnitCodes(companyId);
    const nextSequence = records.reduce(
      (maximum, record) => Math.max(maximum, Number(record.code?.replace(/\D/g, "") ?? "") || 0),
      0,
    ) + 1;
    return `${type}${String(nextSequence).padStart(3, "0")}`;
  },

  async nextSku(companyId: string, categoryName: string) {
    const prefix = skuPrefix(categoryName);
    const products = await productsRepository.listSkus(companyId, prefix);
    const nextSequence = products.reduce((maximum, product) => {
      const suffix = Number(product.sku.slice(prefix.length));
      return Number.isInteger(suffix) ? Math.max(maximum, suffix) : maximum;
    }, 0) + 1;
    return `${prefix}${String(nextSequence).padStart(3, "0")}`;
  },
};
