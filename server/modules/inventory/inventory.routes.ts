import { Router } from "express";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { InventoryError, inventoryService } from "./inventory.service.js";

const id = z.string().uuid();
const companyId = (request: AuthenticatedRequest) => request.auth!.companyId;
const userId = (request: AuthenticatedRequest) => request.auth!.sub;
const canMutateInventory = (request: AuthenticatedRequest, response: Response) => {
  if (request.auth?.role !== UserRole.SALES_PURCHASING) return true;
  response.status(403).json({ message: "El rol Vendedor solo puede consultar el inventario." });
  return false;
};
const handleError = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof z.ZodError)
    return response
      .status(400)
      .json({ message: "Datos de inventario inválidos.", details: error.flatten() });
  if (error instanceof InventoryError)
    return response.status(error.status).json({ message: error.message });
  if ((error as { code?: string }).code === "P2002")
    return response.status(409).json({ message: "Ya existe un registro con ese código." });
  next(error);
};
const warehouseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().max(30).optional(),
  type: z.enum(["MAIN", "STORE", "DEPOT", "TEMPORARY"]),
  address: z.string().trim().max(250).optional(),
  isPrimary: z.boolean().optional(),
});
const movementSchema = z.object({
  productId: id,
  warehouseId: id,
  type: z.enum([
    "INITIAL",
    "CUSTOMER_RETURN",
    "SUPPLIER_RETURN",
    "POSITIVE_ADJUSTMENT",
    "NEGATIVE_ADJUSTMENT",
    "DAMAGED",
    "EXPIRED",
  ]),
  quantity: z.coerce.number().positive(),
  reason: z.string().trim().min(3).max(500),
  documentRef: z.string().trim().max(100).optional(),
  batchId: id.optional(),
});

export const inventoryRouter = Router();
inventoryRouter.get("/warehouses", async (req, res, next) => {
  try {
    res.json(await inventoryService.listWarehouses(companyId(req as AuthenticatedRequest)));
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.post("/warehouses", async (req, res, next) => {
  try {
    if (!canMutateInventory(req as AuthenticatedRequest, res)) return;
    res
      .status(201)
      .json(
        await inventoryService.createWarehouse(
          companyId(req as AuthenticatedRequest),
          warehouseSchema.parse(req.body),
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.get("/stocks", async (req, res, next) => {
  try {
    res.json(await inventoryService.listStocks(companyId(req as AuthenticatedRequest)));
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.get("/movements", async (req, res, next) => {
  try {
    const q = z.object({ productId: id.optional(), warehouseId: id.optional() }).parse(req.query);
    res.json(
      await inventoryService.listMovements(
        companyId(req as AuthenticatedRequest),
        q.productId,
        q.warehouseId,
      ),
    );
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.post("/movements", async (req, res, next) => {
  try {
    if (!canMutateInventory(req as AuthenticatedRequest, res)) return;
    res
      .status(201)
      .json(
        await inventoryService.recordMovement(
          companyId(req as AuthenticatedRequest),
          userId(req as AuthenticatedRequest),
          movementSchema.parse(req.body),
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.post("/transfers", async (req, res, next) => {
  try {
    if (!canMutateInventory(req as AuthenticatedRequest, res)) return;
    const body = z
      .object({
        originWarehouseId: id,
        destinationWarehouseId: id,
        reference: z.string().max(100).optional(),
        notes: z.string().max(500).optional(),
        items: z.array(z.object({ productId: id, quantity: z.coerce.number().positive() })).min(1),
      })
      .parse(req.body);
    res
      .status(201)
      .json(
        await inventoryService.transfer(
          companyId(req as AuthenticatedRequest),
          userId(req as AuthenticatedRequest),
          body,
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.get("/batches", async (req, res, next) => {
  try {
    const q = z.object({ warehouseId: id.optional() }).parse(req.query);
    res.json(
      await inventoryService.listBatches(companyId(req as AuthenticatedRequest), q.warehouseId),
    );
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.post("/batches", async (req, res, next) => {
  try {
    if (!canMutateInventory(req as AuthenticatedRequest, res)) return;
    const body = z
      .object({
        productId: id,
        warehouseId: id,
        lotNumber: z.string().trim().min(1),
        manufacturedAt: z.coerce.date().optional(),
        expiresAt: z.coerce.date().optional(),
        quantity: z.coerce.number().nonnegative().optional(),
      })
      .parse(req.body);
    res
      .status(201)
      .json(await inventoryService.createBatch(companyId(req as AuthenticatedRequest), body));
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.post("/counts", async (req, res, next) => {
  try {
    if (!canMutateInventory(req as AuthenticatedRequest, res)) return;
    const body = z
      .object({
        warehouseId: id,
        notes: z.string().max(500).optional(),
        items: z
          .array(
            z.object({
              productId: id,
              countedQuantity: z.coerce.number().nonnegative(),
              reason: z.string().max(500).optional(),
            }),
          )
          .min(1),
      })
      .parse(req.body);
    res
      .status(201)
      .json(
        await inventoryService.createCount(
          companyId(req as AuthenticatedRequest),
          userId(req as AuthenticatedRequest),
          body.warehouseId,
          body.items,
          body.notes,
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});
inventoryRouter.post("/counts/:id/approve", async (req, res, next) => {
  try {
    if (!canMutateInventory(req as AuthenticatedRequest, res)) return;
    res.json(
      await inventoryService.approveCount(
        companyId(req as AuthenticatedRequest),
        userId(req as AuthenticatedRequest),
        id.parse(req.params.id),
      ),
    );
  } catch (e) {
    handleError(e, res, next);
  }
});
