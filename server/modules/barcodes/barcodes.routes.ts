import { Router } from "express";
import { z } from "zod";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { BarcodeError, barcodesService } from "./barcodes.service.js";

const codeFormat = z.enum(["CODE128", "EAN13"]);
const companyId = (request: AuthenticatedRequest) => request.auth!.companyId;
const sendError = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) return response.status(400).json({ message: "Datos de código de barras inválidos.", details: error.flatten() });
  if (error instanceof BarcodeError) return response.status(error.status).json({ message: error.message });
  next(error);
};

export const barcodesRouter = Router();
barcodesRouter.get("/", async (req, res, next) => { try { const query = z.object({ search: z.string().optional() }).parse(req.query); res.json(await barcodesService.list(companyId(req as AuthenticatedRequest), query.search)); } catch (error) { sendError(error, res, next); } });
barcodesRouter.post("/generate", async (req, res, next) => { try { const body = z.object({ format: codeFormat }).parse(req.body); res.json(await barcodesService.generate(companyId(req as AuthenticatedRequest), body.format)); } catch (error) { sendError(error, res, next); } });
barcodesRouter.post("/", async (req, res, next) => { try { const body = z.object({ productId: z.string().uuid(), code: z.string().trim().min(3).max(80), format: codeFormat, isPrimary: z.boolean().optional() }).parse(req.body); res.status(201).json(await barcodesService.create(companyId(req as AuthenticatedRequest), body)); } catch (error) { sendError(error, res, next); } });
barcodesRouter.patch("/:id/primary", async (req, res, next) => { try { res.json(await barcodesService.setPrimary(companyId(req as AuthenticatedRequest), z.string().uuid().parse(req.params.id))); } catch (error) { sendError(error, res, next); } });
barcodesRouter.delete("/:id", async (req, res, next) => { try { await barcodesService.remove(companyId(req as AuthenticatedRequest), z.string().uuid().parse(req.params.id)); res.status(204).send(); } catch (error) { sendError(error, res, next); } });
