import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/auth.middleware.js";
import {
  categoryUpdateSchema,
  classificationSchema,
  measurementUnitSchema,
  measurementUnitUpdateSchema,
  productIdSchema,
  productListQuerySchema,
  productSchema,
  productStatusSchema,
} from "../schemas/products.schema.js";
import { productsService } from "../services/products.service.js";

const companyId = (request: Request) => (request as AuthenticatedRequest).auth!.companyId;

export const productsController = {
  async listCategories(request: Request, response: Response) {
    response.json(await productsService.listCategories(companyId(request)));
  },
  async createCategory(request: Request, response: Response) {
    const body = classificationSchema.parse(request.body);
    response
      .status(201)
      .json(await productsService.createCategory(companyId(request), body.name, body.description));
  },
  async updateCategory(request: Request, response: Response) {
    response.json(
      await productsService.updateCategory(
        companyId(request),
        productIdSchema.parse(request.params.id),
        categoryUpdateSchema.parse(request.body),
      ),
    );
  },
  async listMeasurementUnits(request: Request, response: Response) {
    response.json(await productsService.listMeasurementUnits(companyId(request)));
  },
  async createMeasurementUnit(request: Request, response: Response) {
    const body = measurementUnitSchema.parse(request.body);
    response
      .status(201)
      .json(await productsService.createMeasurementUnit(companyId(request), body.code, body.name));
  },
  async updateMeasurementUnit(request: Request, response: Response) {
    response.json(
      await productsService.updateMeasurementUnit(
        companyId(request),
        productIdSchema.parse(request.params.id),
        measurementUnitUpdateSchema.parse(request.body),
      ),
    );
  },
  async listBrands(request: Request, response: Response) {
    response.json(await productsService.listBrands(companyId(request)));
  },
  async createBrand(request: Request, response: Response) {
    const body = classificationSchema.parse(request.body);
    response.status(201).json(await productsService.createBrand(companyId(request), body.name));
  },
  async list(request: Request, response: Response) {
    const query = productListQuerySchema.parse(request.query);
    response.json(
      await productsService.list(
        companyId(request),
        query.search,
        query.isActive === undefined ? undefined : query.isActive === "true",
      ),
    );
  },
  async create(request: Request, response: Response) {
    response
      .status(201)
      .json(await productsService.create(companyId(request), productSchema.parse(request.body)));
  },
  async history(request: Request, response: Response) {
    response.json(
      await productsService.history(companyId(request), productIdSchema.parse(request.params.id)),
    );
  },
  async getById(request: Request, response: Response) {
    const product = await productsService.getById(
      companyId(request),
      productIdSchema.parse(request.params.id),
    );
    if (!product) return response.status(404).json({ message: "Producto no encontrado." });
    return response.json(product);
  },
  async update(request: Request, response: Response) {
    response.json(
      await productsService.update(
        companyId(request),
        productIdSchema.parse(request.params.id),
        productSchema.parse(request.body),
      ),
    );
  },
  async setStatus(request: Request, response: Response) {
    const body = productStatusSchema.parse(request.body);
    response.json(
      await productsService.setStatus(
        companyId(request),
        productIdSchema.parse(request.params.id),
        body.isActive,
      ),
    );
  },
  async remove(request: Request, response: Response) {
    const product = await productsService.remove(
      companyId(request),
      productIdSchema.parse(request.params.id),
    );
    if (product) return response.status(200).json(product);
    return response.status(204).send();
  },
};

export type ProductControllerMethod = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;
