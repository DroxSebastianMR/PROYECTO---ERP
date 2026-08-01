import { Router } from "express";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { CustomerError, customersService } from "./customers.service.js";

const uuid = z.string().uuid();
const customerInput = z.object({
  customerType: z.enum(["PERSONA_NATURAL", "EMPRESA"]),
  documentType: z.enum(["DNI", "RUC", "CE", "PASAPORTE", "OTRO"]),
  documentNumber: z.string().trim().min(1).max(20),
  firstName: z.string().trim().max(100).optional(), lastName: z.string().trim().max(100).optional(),
  birthDate: z.coerce.date().optional(), gender: z.enum(["M", "F", "OTRO"]).optional(),
  civilStatus: z.enum(["SOLTERO", "CASADO", "DIVORCIADO", "VIUDO"]).optional(),
  phone: z.string().trim().max(50).optional(), mobilePhone: z.string().trim().max(50).optional(), email: z.string().email().optional(),
  companyName: z.string().trim().max(180).optional(), tradeName: z.string().trim().max(180).optional(),
  legalRepresentative: z.string().trim().max(180).optional(), representativeRole: z.string().trim().max(100).optional(),
  companyPhone: z.string().trim().max(50).optional(), companyEmail: z.string().email().optional(),
  address: z.string().trim().max(300).optional(), ubigeo: z.string().trim().max(12).optional(),
  category: z.enum(["REGULAR", "VIP", "MAYORISTA", "MINORISTA", "CORPORATIVO"]), notes: z.string().trim().max(2000).optional(),
});
const companyId = (request: AuthenticatedRequest) => request.auth!.companyId;
const fail = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) return response.status(400).json({ message: "Datos de cliente inválidos.", details: error.flatten() });
  if (error instanceof CustomerError) return response.status(error.status).json({ message: error.message });
  if ((error as { code?: string }).code === "P2002") return response.status(409).json({ message: "El documento ya está registrado para este cliente." });
  next(error);
};

export const customersRouter = Router();
customersRouter.get("/", async (req, res, next) => { try { res.json(await customersService.list(companyId(req as AuthenticatedRequest))); } catch (error) { fail(error, res, next); } });
customersRouter.get("/:id", async (req, res, next) => { try { const customer = await customersService.get(companyId(req as AuthenticatedRequest), uuid.parse(req.params.id)); if (!customer) return res.status(404).json({ message: "Cliente no encontrado." }); res.json(customer); } catch (error) { fail(error, res, next); } });
customersRouter.post("/", async (req, res, next) => { try { res.status(201).json(await customersService.create(companyId(req as AuthenticatedRequest), customerInput.parse(req.body))); } catch (error) { fail(error, res, next); } });
customersRouter.put("/:id", async (req, res, next) => { try { res.json(await customersService.update(companyId(req as AuthenticatedRequest), uuid.parse(req.params.id), customerInput.partial().parse(req.body))); } catch (error) { fail(error, res, next); } });
customersRouter.patch("/:id/status", async (req, res, next) => { try { const body = z.object({ status: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]) }).parse(req.body); res.json(await customersService.setStatus(companyId(req as AuthenticatedRequest), uuid.parse(req.params.id), body.status)); } catch (error) { fail(error, res, next); } });
customersRouter.delete("/:id", async (req, res, next) => { try { await customersService.remove(companyId(req as AuthenticatedRequest), uuid.parse(req.params.id)); res.status(204).send(); } catch (error) { fail(error, res, next); } });
