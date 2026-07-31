import { httpClient } from "@/lib/api/http-client";
import type {
  CreateProductInput,
  Product,
  ProductMetrics,
  UpdateProductInput,
} from "@/features/products/types/product.types";

type ProductApi = Omit<
  Product,
  | "category"
  | "brand"
  | "salePrice"
  | "costPrice"
  | "wholesalePrice"
  | "totalStock"
  | "minStock"
  | "stocks"
> & {
  category?: { name: string } | null;
  brand?: { name: string } | null;
  purchasePrice?: string | number | null;
  salePrice: string | number;
  wholesalePrice?: string | number | null;
  wholesaleMinQuantity?: string | number | null;
  stocks?: {
    id: string;
    quantity: string | number;
    minimum: string | number;
    warehouse: { name: string };
  }[];
};

const number = (value: string | number | null | undefined) => Number(value ?? 0);
const mapProduct = (product: ProductApi): Product => ({
  ...product,
  category: product.category?.name ?? "Sin categoría",
  brand: product.brand?.name ?? "Sin marca",
  costPrice: number(product.purchasePrice),
  salePrice: number(product.salePrice),
  wholesalePrice: product.wholesalePrice === null ? undefined : number(product.wholesalePrice),
  wholesaleMinQuantity: product.wholesaleMinQuantity === null ? undefined : number(product.wholesaleMinQuantity),
  totalStock: product.stocks?.reduce((total, stock) => total + number(stock.quantity), 0) ?? 0,
  minStock: product.stocks?.reduce((total, stock) => total + number(stock.minimum), 0) ?? 0,
  stocks: product.stocks?.map((stock) => ({
    id: stock.id,
    warehouseName: stock.warehouse.name,
    quantity: number(stock.quantity),
    minimum: number(stock.minimum),
  })),
});

const toPayload = (input: CreateProductInput | UpdateProductInput) => ({
  ...(input.sku ? { sku: input.sku } : {}),
  name: input.name,
  categoryName: input.category,
  brandName: input.brand || null,
  barcode: input.barcode || null,
  unit: input.unit,
  presentation: input.presentation || null,
  purchasePrice: input.costPrice || null,
  salePrice: input.salePrice,
  wholesalePrice: input.wholesalePrice || null,
  wholesaleMinQuantity: input.wholesaleMinQuantity || null,
  taxTreatment: input.taxTreatment ?? "TAXED",
  imageUrl: input.imageUrl || null,
  description: input.description || null,
  presentations: input.presentations ?? [],
});

export const productService = {
  async getProducts(): Promise<Product[]> {
    const data = await httpClient<ProductApi[]>("/products");
    return data.map(mapProduct);
  },
  getMeasurementUnits: () => httpClient<import("@/features/products/types/product.types").MeasurementUnit[]>("/products/measurement-units"),
  createMeasurementUnit: (input: { code: string; name: string }) =>
    httpClient<import("@/features/products/types/product.types").MeasurementUnit>("/products/measurement-units", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  async createProduct(input: CreateProductInput): Promise<Product> {
    return mapProduct(
      await httpClient<ProductApi>("/products", {
        method: "POST",
        body: JSON.stringify(toPayload(input)),
      }),
    );
  },
  async updateProduct(input: UpdateProductInput): Promise<Product> {
    return mapProduct(
      await httpClient<ProductApi>(`/products/${input.id}`, {
        method: "PUT",
        body: JSON.stringify(toPayload(input)),
      }),
    );
  },
  async toggleProductStatus(id: string, isActive: boolean): Promise<Product> {
    return mapProduct(
      await httpClient<ProductApi>(`/products/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    );
  },
  async deleteProduct(id: string): Promise<void> {
    await httpClient<void>(`/products/${id}`, { method: "DELETE" });
  },
  calculateMetrics(products: Product[]): ProductMetrics {
    return {
      totalProducts: products.length,
      totalCategories: new Set(products.map((product) => product.category)).size,
      activeProducts: products.filter((product) => product.isActive).length,
      inactiveProducts: products.filter((product) => !product.isActive).length,
    };
  },
};
