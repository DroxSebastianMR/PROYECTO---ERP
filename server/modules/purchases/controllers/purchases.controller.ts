import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/auth.middleware.js";
import {
  purchaseIdSchema,
  purchasePaymentSchema,
  purchaseReceiptSchema,
  purchaseSchema,
  purchaseUpdateSchema,
  supplierSchema,
  supplierUpdateSchema,
} from "../schemas/purchases.schema.js";
import { purchasesService } from "../services/purchases.service.js";
import { suppliersService } from "../services/suppliers.service.js";

const companyId = (request: Request) => (request as AuthenticatedRequest).auth!.companyId;
const userId = (request: Request) => (request as AuthenticatedRequest).auth!.sub;

export const purchasesController = {
  async listSuppliers(request: Request, response: Response) {
    response.json(await suppliersService.list(companyId(request)));
  },

  async createSupplier(request: Request, response: Response) {
    response
      .status(201)
      .json(await suppliersService.create(companyId(request), supplierSchema.parse(request.body)));
  },

  async updateSupplier(request: Request, response: Response) {
    response.json(
      await suppliersService.update(
        companyId(request),
        purchaseIdSchema.parse(request.params.id),
        supplierUpdateSchema.parse(request.body),
      ),
    );
  },

  async removeSupplier(request: Request, response: Response) {
    response.json(
      await suppliersService.remove(companyId(request), purchaseIdSchema.parse(request.params.id)),
    );
  },

  async list(request: Request, response: Response) {
    response.json(await purchasesService.list(companyId(request)));
  },

  async create(request: Request, response: Response) {
    response
      .status(201)
      .json(
        await purchasesService.create(
          companyId(request),
          userId(request),
          purchaseSchema.parse(request.body),
        ),
      );
  },

  async update(request: Request, response: Response) {
    response.json(
      await purchasesService.update(
        companyId(request),
        purchaseIdSchema.parse(request.params.id),
        purchaseUpdateSchema.parse(request.body),
      ),
    );
  },

  async getById(request: Request, response: Response) {
    const purchase = await purchasesService.getById(
      companyId(request),
      purchaseIdSchema.parse(request.params.id),
    );
    if (!purchase) return response.status(404).json({ message: "Compra no encontrada." });
    return response.json(purchase);
  },

  async order(request: Request, response: Response) {
    response.json(
      await purchasesService.order(companyId(request), purchaseIdSchema.parse(request.params.id)),
    );
  },

  async receive(request: Request, response: Response) {
    response
      .status(201)
      .json(
        await purchasesService.receive(
          companyId(request),
          userId(request),
          purchaseIdSchema.parse(request.params.id),
          purchaseReceiptSchema.parse(request.body),
        ),
      );
  },

  async registerPayment(request: Request, response: Response) {
    response
      .status(201)
      .json(
        await purchasesService.registerPayment(
          companyId(request),
          purchaseIdSchema.parse(request.params.id),
          purchasePaymentSchema.parse(request.body),
        ),
      );
  },
};

export type PurchaseControllerMethod = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;
