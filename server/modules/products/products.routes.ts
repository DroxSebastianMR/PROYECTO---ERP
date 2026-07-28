import { Router } from "express";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { ProductCatalogError, productsService } from "./products.service.js";

const idSchema = z.string().uuid();
const presentationSchema = z.object({
  name: z.string().trim().min(1).max(120), unit: z.string().trim().min(1).max(20),
  unitsPerBase: z.coerce.number().positive(), barcode: z.string().trim().max(80).nullable().optional(),
  salePrice: z.coerce.number().nonnegative().nullable().optional(), wholesalePrice: z.coerce.number().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
});
const productSchema = z.object({
  sku: z.string().trim().min(1).max(80), barcode: z.string().trim().max(80).nullable().optional(), name: z.string().trim().min(1).max(180),
  categoryId: z.string().uuid().nullable().optional(), categoryName: z.string().trim().max(100).nullable().optional(),
  brandId: z.string().uuid().nullable().optional(), brandName: z.string().trim().max(100).nullable().optional(), unit: z.string().trim().min(1).max(20),
  presentation: z.string().trim().max(160).nullable().optional(), purchasePrice: z.coerce.number().nonnegative().nullable().optional(),
  salePrice: z.coerce.number().nonnegative(), wholesalePrice: z.coerce.number().nonnegative().nullable().optional(),
  taxTreatment: z.enum(["TAXED", "EXONERATED", "UNAFFECTED"]), imageUrl: z.string().url().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(), presentations: z.array(presentationSchema).max(30).optional(),
});
const classificationSchema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(500).optional() });
const companyId = (request: AuthenticatedRequest) => request.auth!.companyId;
const sendError = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) return response.status(400).json({ message: "Datos de producto inválidos.", details: error.flatten() });
  if (error instanceof ProductCatalogError) return response.status(error.status).json({ message: error.message });
  if ((error as { code?: string }).code === "P2002") return response.status(409).json({ message: "Ya existe un registro con ese código." });
  next(error);
};

export const productsRouter = Router();
productsRouter.get("/categories", async (request, response, next) => { try { response.json(await productsService.listCategories(companyId(request as AuthenticatedRequest))); } catch (error) { sendError(error, response, next); } });
productsRouter.post("/categories", async (request, response, next) => { try { const body = classificationSchema.parse(request.body); response.status(201).json(await productsService.createCategory(companyId(request as AuthenticatedRequest), body.name, body.description)); } catch (error) { sendError(error, response, next); } });
productsRouter.get("/brands", async (request, response, next) => { try { response.json(await productsService.listBrands(companyId(request as AuthenticatedRequest))); } catch (error) { sendError(error, response, next); } });
productsRouter.post("/brands", async (request, response, next) => { try { const body = classificationSchema.parse(request.body); response.status(201).json(await productsService.createBrand(companyId(request as AuthenticatedRequest), body.name)); } catch (error) { sendError(error, response, next); } });
productsRouter.get("/", async (request, response, next) => { try { const query = z.object({ search: z.string().optional(), isActive: z.enum(["true", "false"]).optional() }).parse(request.query); response.json(await productsService.list(companyId(request as AuthenticatedRequest), query.search, query.isActive === undefined ? undefined : query.isActive === "true")); } catch (error) { sendError(error, response, next); } });
productsRouter.post("/", async (request, response, next) => { try { response.status(201).json(await productsService.create(companyId(request as AuthenticatedRequest), productSchema.parse(request.body))); } catch (error) { sendError(error, response, next); } });
productsRouter.get("/:id/history", async (request, response, next) => { try { response.json(await productsService.history(companyId(request as AuthenticatedRequest), idSchema.parse(request.params.id))); } catch (error) { sendError(error, response, next); } });
productsRouter.get("/:id", async (request, response, next) => { try { const product = await productsService.getById(companyId(request as AuthenticatedRequest), idSchema.parse(request.params.id)); if (!product) return response.status(404).json({ message: "Producto no encontrado." }); response.json(product); } catch (error) { sendError(error, response, next); } });
productsRouter.put("/:id", async (request, response, next) => { try { response.json(await productsService.update(companyId(request as AuthenticatedRequest), idSchema.parse(request.params.id), productSchema.parse(request.body))); } catch (error) { sendError(error, response, next); } });
productsRouter.patch("/:id/status", async (request, response, next) => { try { const body = z.object({ isActive: z.boolean() }).parse(request.body); response.json(await productsService.setStatus(companyId(request as AuthenticatedRequest), idSchema.parse(request.params.id), body.isActive)); } catch (error) { sendError(error, response, next); } });
productsRouter.delete("/:id", async (request, response, next) => { try { await productsService.remove(companyId(request as AuthenticatedRequest), idSchema.parse(request.params.id)); response.status(204).send(); } catch (error) { sendError(error, response, next); } });
