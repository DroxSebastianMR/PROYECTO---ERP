export type ProductUnit = "UND" | "KG" | "MTR" | "LTR" | "BOL" | "CAJ" | "SET";

export type ProductStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface StockByWarehouse {
  id: string;
  warehouseName: string;
  quantity: number;
  minimum: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  barcode?: string | null;
  presentation?: string | null;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  taxTreatment?: "TAXED" | "EXONERATED" | "UNAFFECTED";
  imageUrl?: string | null;
  unit: ProductUnit | string;
  salePrice: number;
  costPrice: number;
  totalStock: number;
  minStock: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  stocks?: StockByWarehouse[];
}

export interface CreateProductInput {
  sku?: string;
  name: string;
  category: string;
  brand?: string;
  barcode?: string;
  presentation?: string;
  unit: string;
  salePrice: number;
  costPrice: number;
  initialStock?: number;
  minStock?: number;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  taxTreatment?: "TAXED" | "EXONERATED" | "UNAFFECTED";
  imageUrl?: string;
  presentations?: ProductPresentationInput[];
  description?: string;
}

export interface ProductPresentationInput {
  name: string;
  unit: string;
  unitsPerBase: number;
  barcode?: string | null;
  salePrice?: number | null;
  wholesalePrice?: number | null;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
  isActive?: boolean;
}

export interface ProductFilterState {
  search: string;
  categories: string[];
  status: ProductStatusFilter;
}

export interface ProductMetrics {
  totalProducts: number;
  totalCategories: number;
  activeProducts: number;
  inactiveProducts: number;
}

export interface MeasurementUnit {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}
