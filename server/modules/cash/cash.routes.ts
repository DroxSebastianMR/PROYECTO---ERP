import { Router } from "express";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { cashService, CashError } from "./cash.service.js";
import { canUseCashPermission, type CashPermission } from "./cash.permissions.js";

const uuid = z.string().uuid();
const companyId = (request: AuthenticatedRequest) => request.auth!.companyId;
const userId = (request: AuthenticatedRequest) => request.auth!.sub;
const ensurePermission = (request: AuthenticatedRequest, response: Response, permission: CashPermission) => {
  if (canUseCashPermission(request.auth!.role, permission)) return true;
  response.status(403).json({ message: `No cuenta con el permiso ${permission}.` }); return false;
};
const fail = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) return response.status(400).json({ message: "Datos de caja invÃ¡lidos.", details: error.flatten() });
  if (error instanceof CashError) return response.status(error.status).json({ message: error.message });
  next(error);
};
const denominations = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];
const countSchema = z.object({ denominations: z.array(z.object({ denomination: z.coerce.number().refine((value) => denominations.includes(value)), quantity: z.coerce.number().int().min(0) })).length(11), explanation: z.string().trim().max(500).optional() });

export const cashRouter = Router();
cashRouter.get("/registers", async (req, res, next) => { try { res.json(await cashService.listRegisters(companyId(req as AuthenticatedRequest))); } catch (e) { fail(e, res, next); } });
cashRouter.get("/current", async (req, res, next) => { try { const session = await cashService.current(companyId(req as AuthenticatedRequest)); res.json(session ? { session, summary: await cashService.summary(session) } : null); } catch (e) { fail(e, res, next); } });
cashRouter.get("/history", async (req, res, next) => { try { res.json(await cashService.history(companyId(req as AuthenticatedRequest))); } catch (e) { fail(e, res, next); } });
cashRouter.get("/history/:id", async (req, res, next) => { try { res.json(await cashService.sessionActivity(companyId(req as AuthenticatedRequest), uuid.parse(req.params.id))); } catch (e) { fail(e, res, next); } });
cashRouter.get("/movements", async (req, res, next) => { try { res.json(await cashService.listMovements(companyId(req as AuthenticatedRequest))); } catch (e) { fail(e, res, next); } });
cashRouter.post("/open", async (req, res, next) => { const request = req as AuthenticatedRequest; try { if (!ensurePermission(request, res, "CAJA_APERTURA")) return; const body = z.object({ cashRegisterId: uuid, openingAmount: z.coerce.number().positive(), notes: z.string().trim().max(500).optional() }).parse(req.body); res.status(201).json(await cashService.open(companyId(request), userId(request), body)); } catch (e) { fail(e, res, next); } });
cashRouter.post("/counts", async (req, res, next) => { const request = req as AuthenticatedRequest; try { if (!ensurePermission(request, res, "CAJA_ARQUEO")) return; res.status(201).json(await cashService.createCount(companyId(request), userId(request), countSchema.parse(req.body))); } catch (e) { fail(e, res, next); } });
cashRouter.post("/movements", async (req, res, next) => { const request = req as AuthenticatedRequest; try { if (!ensurePermission(request, res, "CAJA_MOVIMIENTO")) return; const body = z.object({ type: z.enum(["INCOME", "EXPENSE"]), description: z.string().trim().min(3).max(250), amount: z.coerce.number().positive(), paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "YAPE_PLIN"]).default("CASH") }).parse(req.body); res.status(201).json(await cashService.createMovement(companyId(request), userId(request), body)); } catch (e) { fail(e, res, next); } });
cashRouter.post("/close", async (req, res, next) => { const request = req as AuthenticatedRequest; try { if (!ensurePermission(request, res, "CAJA_CIERRE")) return; const body = z.object({ countedAmount: z.coerce.number().nonnegative(), notes: z.string().trim().max(500).optional() }).parse(req.body); res.json(await cashService.close(companyId(request), userId(request), { ...body, ip: request.ip })); } catch (e) { fail(e, res, next); } });
