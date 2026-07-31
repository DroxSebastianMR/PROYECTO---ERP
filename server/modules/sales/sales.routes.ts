import { Router } from "express";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { InventoryError } from "../inventory/inventory.service.js";
import { SaleError, salesService } from "./sales.service.js";

const uuid = z.string().uuid();
const companyId = (request: AuthenticatedRequest) => request.auth!.companyId;
const userId = (request: AuthenticatedRequest) => request.auth!.sub;
const fail = (cause: unknown, response: Response, next: NextFunction) => {
  if (cause instanceof z.ZodError)
    return response
      .status(400)
      .json({ message: "Datos de venta inválidos.", details: cause.flatten() });
  if (cause instanceof SaleError || cause instanceof InventoryError)
    return response.status(cause.status).json({ message: cause.message });
  next(cause);
};
const saleSchema = z.object({
  customerId: uuid.optional(),
  warehouseId: uuid,
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "YAPE_PLIN", "CREDIT"]),
  documentType: z.literal("RECEIPT"),
  dueAt: z.coerce.date().optional(),
  items: z
    .array(
      z.object({
        productId: uuid,
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().nonnegative(),
        discount: z.coerce.number().nonnegative().optional(),
      }),
    )
    .min(1),
});

export const salesRouter = Router();
salesRouter.get("/customers", async (req, res, next) => {
  try {
    res.json(await salesService.listCustomers(companyId(req as AuthenticatedRequest)));
  } catch (error) {
    fail(error, res, next);
  }
});
salesRouter.post("/customers", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().trim().min(2),
        document: z.string().trim().max(20).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(50).optional(),
        creditLimit: z.coerce.number().nonnegative().optional(),
        creditDays: z.coerce.number().int().min(0).max(365).optional(),
      })
      .parse(req.body);
    res
      .status(201)
      .json(await salesService.createCustomer(companyId(req as AuthenticatedRequest), body));
  } catch (error) {
    fail(error, res, next);
  }
});
salesRouter.get("/", async (req, res, next) => {
  try {
    res.json(await salesService.list(companyId(req as AuthenticatedRequest)));
  } catch (error) {
    fail(error, res, next);
  }
});
salesRouter.post("/", async (req, res, next) => {
  try {
    res
      .status(201)
      .json(
        await salesService.create(
          companyId(req as AuthenticatedRequest),
          userId(req as AuthenticatedRequest),
          saleSchema.parse(req.body),
        ),
      );
  } catch (error) {
    fail(error, res, next);
  }
});
salesRouter.get("/:id", async (req, res, next) => {
  try {
    const sale = await salesService.get(
      companyId(req as AuthenticatedRequest),
      uuid.parse(req.params.id),
    );
    if (!sale) return res.status(404).json({ message: "Venta no encontrada." });
    res.json(sale);
  } catch (error) {
    fail(error, res, next);
  }
});
salesRouter.post("/:id/confirm", async (req, res, next) => {
  try {
    res.json(
      await salesService.confirm(
        companyId(req as AuthenticatedRequest),
        userId(req as AuthenticatedRequest),
        uuid.parse(req.params.id),
      ),
    );
  } catch (error) {
    fail(error, res, next);
  }
});
salesRouter.post("/:id/payments", async (req, res, next) => {
  try {
    const body = z
      .object({
        amount: z.coerce.number().positive(),
        method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "YAPE_PLIN", "CREDIT"]),
        reference: z.string().max(100).optional(),
      })
      .parse(req.body);
    res
      .status(201)
      .json(
        await salesService.addPayment(
          companyId(req as AuthenticatedRequest),
          uuid.parse(req.params.id),
          body,
        ),
      );
  } catch (error) {
    fail(error, res, next);
  }
});
salesRouter.post("/:id/dispatch", async (req, res, next) => {
  try {
    const body = z.object({ notes: z.string().max(500).optional() }).parse(req.body);
    res.json(
      await salesService.dispatch(
        companyId(req as AuthenticatedRequest),
        userId(req as AuthenticatedRequest),
        uuid.parse(req.params.id),
        body.notes,
      ),
    );
  } catch (error) {
    fail(error, res, next);
  }
});
salesRouter.post("/:id/returns", async (req, res, next) => {
  try {
    const body = z
      .object({
        warehouseId: uuid,
        reason: z.string().trim().min(3).max(500),
        lines: z
          .array(z.object({ saleItemId: uuid, quantity: z.coerce.number().positive() }))
          .min(1),
      })
      .parse(req.body);
    res
      .status(201)
      .json(
        await salesService.registerReturn(
          companyId(req as AuthenticatedRequest),
          userId(req as AuthenticatedRequest),
          uuid.parse(req.params.id),
          body,
        ),
      );
  } catch (error) {
    fail(error, res, next);
  }
});
