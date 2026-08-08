import { PurchaseStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { PurchaseError } from "../errors/purchases.errors.js";
import { purchasesRepository } from "../repositories/purchases.repository.js";
import type { PurchasePaymentInput } from "../types/purchases.types.js";

export const purchasePaymentsService = {
  async registerPayment(companyId: string, id: string, input: PurchasePaymentInput) {
    const purchase = await purchasesRepository.findById(companyId, id);
    if (!purchase?.payable) throw new PurchaseError("La compra no tiene una deuda pendiente.", 409);

    const balance = Number(purchase.payable.originalAmount) - Number(purchase.payable.paidAmount);
    if (input.amount <= 0 || input.amount > balance)
      throw new PurchaseError("El pago supera el saldo pendiente.");

    return prisma.$transaction(async (transaction) => {
      const payable = await purchasesRepository.updatePayable(transaction, purchase.payable!.id, {
        paidAmount: { increment: input.amount },
        payments: { create: input },
      });
      const paid = Number(payable.paidAmount) >= Number(payable.originalAmount);
      await purchasesRepository.updatePayable(transaction, payable.id, {
        status: paid ? "PAID" : "PARTIAL",
      });
      if (paid)
        await purchasesRepository.updatePurchaseStatus(transaction, id, PurchaseStatus.PAID);
      return payable;
    }, { maxWait: 10_000, timeout: 30_000 });
  },
};
