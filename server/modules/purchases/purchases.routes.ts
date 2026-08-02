import { Router } from "express";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { PurchaseError, purchasesService } from "./purchases.service.js";

const uuid = z.string().uuid();
const companyId = (request: AuthenticatedRequest) => request.auth!.companyId;
const userId = (request: AuthenticatedRequest) => request.auth!.sub;
const error = (cause: unknown, response: Response, next: NextFunction) => {
  if (cause instanceof z.ZodError)
    return response
      .status(400)
      .json({ message: "Datos de compra inválidos.", details: cause.flatten() });
  if (cause instanceof PurchaseError)
    return response.status(cause.status).json({ message: cause.message });
  if ((cause as { code?: string }).code === "P2002")
    return response.status(409).json({ message: "Ya existe un registro con ese número." });
  next(cause);
};
const supplierSchema = z.object({
  ruc: z.string().trim().min(8).max(15).optional(),
  businessName: z.string().trim().min(2).max(180),
  tradeName: z.string().trim().max(180).optional(),
  address: z.string().trim().max(250).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().email().optional(),
  contactName: z.string().trim().max(120).optional(),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
});
const purchaseSchema = z
  .object({
    supplierId: uuid.optional(),
    supplierName: z.string().trim().min(2).optional(),
    warehouseId: uuid.optional(),
    expectedDeliveryAt: z.coerce.date().optional(),
    purchasedAt: z.coerce.date().optional(),
    warehouseEntryAt: z.coerce.date().optional(),
    supplierDocumentNumber: z.string().trim().min(3).max(80).optional(),
    notes: z.string().trim().max(1000).optional(),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "YAPE_PLIN", "CREDIT"]).optional(),
    currency: z.string().length(3).optional(),
    items: z
      .array(
        z.object({
          productId: uuid,
          quantity: z.coerce.number().positive(),
          unitCost: z.coerce.number().nonnegative(),
          presentationName: z.string().trim().max(160).optional(),
          unit: z.string().trim().max(30).optional(),
          discount: z.coerce.number().nonnegative().optional(),
          taxRate: z.coerce.number().min(0).max(100).optional(),
        }),
      )
      .min(1),
  })
  .refine((input) => Boolean(input.supplierId || input.supplierName), {
    message: "Selecciona o registra un proveedor.",
  });

export const purchasesRouter = Router();
purchasesRouter.get("/suppliers", async (req, res, next) => {
  try {
    res.json(await purchasesService.listSuppliers(companyId(req as AuthenticatedRequest)));
  } catch (e) {
    error(e, res, next);
  }
});
purchasesRouter.post("/suppliers", async (req, res, next) => {
  try {
    res
      .status(201)
      .json(
        await purchasesService.createSupplier(
          companyId(req as AuthenticatedRequest),
          supplierSchema.parse(req.body),
        ),
      );
  } catch (e) {
    error(e, res, next);
  }
});
purchasesRouter.get("/", async (req, res, next) => {
  try {
    res.json(await purchasesService.list(companyId(req as AuthenticatedRequest)));
  } catch (e) {
    error(e, res, next);
  }
});
purchasesRouter.post("/", async (req, res, next) => {
  try {
    res
      .status(201)
      .json(
        await purchasesService.create(
          companyId(req as AuthenticatedRequest),
          purchaseSchema.parse(req.body),
        ),
      );
  } catch (e) {
    error(e, res, next);
  }
});
purchasesRouter.get("/:id", async (req, res, next) => {
  try {
    const purchase = await purchasesService.getById(
      companyId(req as AuthenticatedRequest),
      uuid.parse(req.params.id),
    );
    if (!purchase) return res.status(404).json({ message: "Compra no encontrada." });
    res.json(purchase);
  } catch (e) {
    error(e, res, next);
  }
});
purchasesRouter.post("/:id/order", async (req, res, next) => {
  try {
    res.json(
      await purchasesService.order(
        companyId(req as AuthenticatedRequest),
        uuid.parse(req.params.id),
      ),
    );
  } catch (e) {
    error(e, res, next);
  }
});
purchasesRouter.post("/:id/receipts", async (req, res, next) => {
  try {
    const body = z
      .object({
        warehouseId: uuid.optional(),
        notes: z.string().max(500).optional(),
        lines: z
          .array(
            z.object({
              purchaseItemId: uuid,
              receivedQuantity: z.coerce.number().positive(),
              damagedQuantity: z.coerce.number().nonnegative().optional(),
              lotNumber: z.string().max(80).optional(),
              expiresAt: z.coerce.date().optional(),
            }),
          )
          .min(1),
      })
      .parse(req.body);
    res
      .status(201)
      .json(
        await purchasesService.receive(
          companyId(req as AuthenticatedRequest),
          userId(req as AuthenticatedRequest),
          uuid.parse(req.params.id),
          body,
        ),
      );
  } catch (e) {
    error(e, res, next);
  }
});
purchasesRouter.post("/:id/payments", async (req, res, next) => {
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
        await purchasesService.registerPayment(
          companyId(req as AuthenticatedRequest),
          uuid.parse(req.params.id),
          body,
        ),
      );
  } catch (e) {
    error(e, res, next);
  }
});
