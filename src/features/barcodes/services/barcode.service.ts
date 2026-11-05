import { toCanvas } from "bwip-js/browser";
import { httpClient } from "@/lib/api/http-client";
import type { BarcodeFormat, ProductBarcode } from "@/features/barcodes/types/barcode.types";

export const barcodeService = {
  list: (search?: string) =>
    httpClient<ProductBarcode[]>(
      `/barcodes${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  generate: (format: BarcodeFormat) =>
    httpClient<{ code: string; format: BarcodeFormat }>("/barcodes/generate", {
      method: "POST",
      body: JSON.stringify({ format }),
    }),
  create: (input: { productId: string; code: string; format: BarcodeFormat; isPrimary: boolean }) =>
    httpClient<ProductBarcode>("/barcodes", { method: "POST", body: JSON.stringify(input) }),
  setPrimary: (id: string) =>
    httpClient<ProductBarcode>(`/barcodes/${id}/primary`, { method: "PATCH" }),
  remove: (id: string) => httpClient<void>(`/barcodes/${id}`, { method: "DELETE" }),
  render: (code: string, format: BarcodeFormat) => {
    const canvas = document.createElement("canvas");
    toCanvas(canvas, {
      bcid: format === "EAN13" ? "ean13" : "code128",
      text: code,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: "center",
    });
    return Promise.resolve(canvas.toDataURL("image/png"));
  },
};
