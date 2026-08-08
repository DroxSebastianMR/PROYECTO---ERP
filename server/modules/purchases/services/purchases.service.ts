import { purchaseOrdersService } from "./purchase-orders.service.js";
import { purchasePaymentsService } from "./purchase-payments.service.js";
import { purchaseReceiptService } from "./purchase-receipts.service.js";

export const purchasesService = {
  ...purchaseOrdersService,
  ...purchaseReceiptService,
  ...purchasePaymentsService,
};
