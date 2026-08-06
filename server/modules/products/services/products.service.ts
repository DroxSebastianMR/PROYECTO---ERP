import { productCatalogService } from "./product-catalog.service.js";
import { productMastersService } from "./product-masters.service.js";

// Public facade consumed by controllers. Domain responsibilities live in focused services.
export const productsService = {
  ...productCatalogService,
  ...productMastersService,
};
