import type { SaleReceipt } from "@/features/sales/types/sale.types";

type CashDrawerResult =
  | { status: "opened" }
  | { status: "skipped"; reason: "digital-payment" | "disabled" }
  | { status: "unavailable" };

type CashDrawerBridgePayload = {
  saleId?: string;
  saleNumber?: string;
  reason: "cash-payment" | "manual-cash-register";
};

const bridgeUrl = import.meta.env.VITE_POS_DRAWER_BRIDGE_URL?.trim();
const isEnabled = import.meta.env.VITE_POS_DRAWER_ENABLED === "true";

const hasCashPayment = (sale: SaleReceipt) =>
  sale.paymentMethod === "CASH" || sale.payments.some((payment) => payment.method === "CASH" && payment.amount > 0);

/**
 * Sends a non-blocking request to the local POS bridge. That bridge is the
 * trusted desktop component responsible for sending the ESC/POS drawer pulse
 * to the thermal printer connected to the RJ11 cash drawer.
 */
const requestDrawerOpen = async (payload: CashDrawerBridgePayload): Promise<CashDrawerResult> => {
  if (!isEnabled || !bridgeUrl) return { status: "skipped", reason: "disabled" };

  try {
    const response = await fetch(bridgeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok ? { status: "opened" } : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
};

export const cashDrawerService = {
  openForCashSale: async (sale: SaleReceipt): Promise<CashDrawerResult> => {
    if (!hasCashPayment(sale)) return { status: "skipped", reason: "digital-payment" };

    return requestDrawerOpen({
      saleId: sale.id,
      saleNumber: sale.number,
      reason: "cash-payment",
    });
  },
  openManually: () => requestDrawerOpen({ reason: "manual-cash-register" }),
};
