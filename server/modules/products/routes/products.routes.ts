import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  productsController,
  type ProductControllerMethod,
} from "../controllers/products.controller.js";
import { ProductCatalogError } from "../errors/products.errors.js";

const handle =
  (handler: ProductControllerMethod) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response
          .status(400)
          .json({ message: "Datos de producto inválidos.", details: error.flatten() });
      }
      if (error instanceof ProductCatalogError) {
        return response.status(error.status).json({ message: error.message });
      }
      if ((error as { code?: string }).code === "P2002") {
        return response.status(409).json({ message: "Ya existe un registro con ese código." });
      }
      return next(error);
    }
  };

export const productsRouter = Router();

productsRouter.get("/categories", handle(productsController.listCategories));
productsRouter.post("/categories", handle(productsController.createCategory));
productsRouter.patch("/categories/:id", handle(productsController.updateCategory));
productsRouter.get("/measurement-units", handle(productsController.listMeasurementUnits));
productsRouter.post("/measurement-units", handle(productsController.createMeasurementUnit));
productsRouter.patch("/measurement-units/:id", handle(productsController.updateMeasurementUnit));
productsRouter.get("/brands", handle(productsController.listBrands));
productsRouter.post("/brands", handle(productsController.createBrand));
productsRouter.get("/barcode-availability", handle(productsController.checkBarcodeAvailability));
productsRouter.get("/", handle(productsController.list));
productsRouter.post("/", handle(productsController.create));
productsRouter.get("/:id/history", handle(productsController.history));
productsRouter.get("/:id", handle(productsController.getById));
productsRouter.put("/:id", handle(productsController.update));
productsRouter.patch("/:id/status", handle(productsController.setStatus));
productsRouter.delete("/:id", handle(productsController.remove));
