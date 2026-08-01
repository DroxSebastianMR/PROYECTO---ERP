export type BarcodeFormat = "CODE128" | "EAN13";

export interface ProductBarcode {
  id: string;
  code: string;
  format: BarcodeFormat;
  isPrimary: boolean;
  createdAt: string;
  product: { id: string; sku: string; name: string; imageUrl?: string | null; isActive?: boolean };
}
