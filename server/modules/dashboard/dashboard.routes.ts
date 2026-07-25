import { Router } from "express";
import { dashboardService } from "./dashboard.service.js";

export const dashboardRouter = Router();
dashboardRouter.get("/summary", async (_request, response, next) => {
  try {
    response.json(await dashboardService.getSummary());
  } catch (error) {
    next(error);
  }
});
