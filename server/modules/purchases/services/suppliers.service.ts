import { PurchaseError } from "../errors/purchases.errors.js";
import { purchasesRepository } from "../repositories/purchases.repository.js";
import type { SupplierInput } from "../types/purchases.types.js";

const createSupplierCode = async (companyId: string) => {
  let sequence = (await purchasesRepository.countSuppliers(companyId)) + 1;
  let code = `PRV${String(sequence).padStart(3, "0")}`;

  while (await purchasesRepository.findSupplierByCode(companyId, code)) {
    code = `PRV${String(++sequence).padStart(3, "0")}`;
  }

  return code;
};

export const suppliersService = {
  list(companyId: string) {
    return purchasesRepository.listSuppliers(companyId);
  },

  async create(companyId: string, input: SupplierInput) {
    return purchasesRepository.createSupplier({
      data: { companyId, code: await createSupplierCode(companyId), ...input },
    });
  },

  async update(companyId: string, id: string, input: Partial<SupplierInput>) {
    const supplier = await purchasesRepository.findSupplier(companyId, id);
    if (!supplier) throw new PurchaseError("Proveedor no encontrado.", 404);
    return purchasesRepository.updateSupplier(id, input);
  },

  async remove(companyId: string, id: string) {
    const supplier = await purchasesRepository.findSupplierWithPurchaseCount(companyId, id);
    if (!supplier) throw new PurchaseError("Proveedor no encontrado.", 404);

    if (supplier._count.purchases > 0) {
      await purchasesRepository.updateSupplier(id, { isActive: false });
      return { action: "deactivated" as const };
    }

    await purchasesRepository.deleteSupplier(id);
    return { action: "deleted" as const };
  },
};
