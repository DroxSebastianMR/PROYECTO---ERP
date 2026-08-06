import type { TaxTreatment } from "@prisma/client";

export type ProductPresentationInput = {
  id?: string;
  name: string;
  unit: string;
  unitsPerBase: number;
  barcode?: string | null;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  isActive?: boolean;
};

export type ProductInput = {
  sku?: string;
  barcode?: string | null;
  name: string;
  categoryId?: string | null;
  categoryName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  unit: string;
  presentation?: string | null;
  purchasePrice?: number | null;
  salePrice: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  taxTreatment: TaxTreatment;
  imageUrl?: string | null;
  description?: string | null;
  initialStock?: number;
  minStock?: number;
  presentations?: ProductPresentationInput[];
};

export type CategoryUpdateInput = {
  name?: string;
  isActive?: boolean;
};

export type MeasurementUnitUpdateInput = {
  code?: string;
  name?: string;
  isActive?: boolean;
};

export type ClassificationInput = {
  categoryId?: string | null;
  categoryName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
};
