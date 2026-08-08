import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { dashboardService } from "./dashboard.service.js";

export const dashboardRouter = Router();
dashboardRouter.get("/overview", async (request, response, next) => {
  try {
    const year = z.coerce.number().int().min(2020).max(2100).catch(new Date().getFullYear()).parse(request.query.year);
    response.json(await dashboardService.getOverview((request as AuthenticatedRequest).auth!.companyId, year));
  } catch (error) {
    next(error);
  }
});
dashboardRouter.get("/top-products", async (request, response, next) => {
  try {
    const year = z.coerce.number().int().min(2020).max(2100).catch(new Date().getFullYear()).parse(request.query.year);
    const month = z.coerce.number().int().min(1).max(12).catch(new Date().getMonth() + 1).parse(request.query.month);
    response.json(await dashboardService.getTopSellingProducts((request as AuthenticatedRequest).auth!.companyId, year, month));
  } catch (error) { next(error); }
});
