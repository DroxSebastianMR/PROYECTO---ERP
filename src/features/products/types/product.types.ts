export type ProductUnit = "UND" | "KG" | "MTR" | "LTR" | "BOL" | "CAJ" | "SET";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE";

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
  sku: string;
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
  category: string;
  stockStatus: string; // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE'
}

export interface ProductMetrics {
  totalProducts: number;
  totalInventoryValue: number;
  totalCategories: number;
  lowStockAlerts: number;
}
