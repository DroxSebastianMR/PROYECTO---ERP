import { httpClient } from "@/lib/api/http-client";
import type { CashMovementsResponse, CashRegister, CashSession, CashSessionActivity, CurrentCash } from "@/features/cash/types/cash.types";

export const cashService = {
  getCurrent: () => httpClient<CurrentCash>("/cash/current"),
  getRegisters: () => httpClient<CashRegister[]>("/cash/registers"),
  getHistory: () => httpClient<CashSession[]>("/cash/history"),
  getSessionActivity: (id: string) => httpClient<CashSessionActivity>(`/cash/history/${id}`),
  getMovements: () => httpClient<CashMovementsResponse>("/cash/movements"),
  createMovement: (input: { type: "INCOME" | "EXPENSE"; description: string; amount: number; paymentMethod: "CASH" | "BANK_TRANSFER" | "CARD" | "YAPE_PLIN" }) => httpClient("/cash/movements", { method: "POST", body: JSON.stringify(input) }),
  open: (input: { cashRegisterId: string; openingAmount: number; notes?: string }) => httpClient<CashSession>("/cash/open", { method: "POST", body: JSON.stringify(input) }),
  count: (input: { denominations: Array<{ denomination: number; quantity: number }>; explanation?: string }) => httpClient("/cash/counts", { method: "POST", body: JSON.stringify(input) }),
  close: (input: { countedAmount: number; notes?: string }) => httpClient<CashSession>("/cash/close", { method: "POST", body: JSON.stringify(input) }),
};
