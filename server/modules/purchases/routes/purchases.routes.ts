import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  purchasesController,
  type PurchaseControllerMethod,
} from "../controllers/purchases.controller.js";
import { PurchaseError } from "../errors/purchases.errors.js";

const handle =
  (handler: PurchaseControllerMethod) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({
          message: "Datos de compra inválidos.",
          details: error.flatten(),
        });
      }
      if (error instanceof PurchaseError) {
        return response.status(error.status).json({ message: error.message });
      }
      if ((error as { code?: string }).code === "P2002") {
        return response.status(409).json({ message: "Ya existe un registro con ese número." });
      }
      return next(error);
    }
  };

export const purchasesRouter = Router();

purchasesRouter.get("/suppliers", handle(purchasesController.listSuppliers));
purchasesRouter.post("/suppliers", handle(purchasesController.createSupplier));
purchasesRouter.patch("/suppliers/:id", handle(purchasesController.updateSupplier));
purchasesRouter.delete("/suppliers/:id", handle(purchasesController.removeSupplier));

purchasesRouter.get("/", handle(purchasesController.list));
purchasesRouter.post("/", handle(purchasesController.create));
purchasesRouter.patch("/:id", handle(purchasesController.update));
purchasesRouter.get("/:id", handle(purchasesController.getById));
purchasesRouter.post("/:id/order", handle(purchasesController.order));
purchasesRouter.post("/:id/receipts", handle(purchasesController.receive));
purchasesRouter.post("/:id/payments", handle(purchasesController.registerPayment));
