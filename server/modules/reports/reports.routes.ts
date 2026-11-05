import { Router } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/permissions.js";
import { inventoryExcelReportService } from "./services/inventory-excel-report.service.js";

export const reportsRouter = Router();

reportsRouter.get("/inventory.xlsx", requirePermission("reports.export"), async (request, response, next) => {
  try {
    const workbook = await inventoryExcelReportService.create((request as AuthenticatedRequest).auth!.companyId);
    response
      .status(200)
      .set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="reporte-inventario.xlsx"',
        "Content-Length": String(workbook.length),
      })
      .send(workbook);
  } catch (error) {
    next(error);
  }
});
