import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { productsRouter } from "./modules/products/routes/products.routes.js";
import { inventoryRouter } from "./modules/inventory/inventory.routes.js";
import { purchasesRouter } from "./modules/purchases/routes/purchases.routes.js";
import { salesRouter } from "./modules/sales/sales.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { customersRouter } from "./modules/customers/customers.routes.js";
import { barcodesRouter } from "./modules/barcodes/barcodes.routes.js";
import { requireAuthentication } from "./modules/auth/auth.middleware.js";
import { cashRouter } from "./modules/cash/cash.routes.js";
import { requirePermission, type Permission } from "./modules/auth/permissions.js";

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin(origin, callback) {
        const allowedOrigins = new Set([env.CLIENT_URL, ...env.CORS_ORIGINS]);
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Origen no autorizado."));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "districorp-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRouter);

  const protectedRoutes = express.Router();

  const authorizeModule = (read: Permission | readonly Permission[], manage: Permission | readonly Permission[] = read) =>
    (request: express.Request, response: express.Response, next: express.NextFunction) =>
      requirePermission(request.method === "GET" ? read : manage)(request, response, next);

  protectedRoutes.use(requireAuthentication);
  protectedRoutes.use("/dashboard", authorizeModule("dashboard.access"), dashboardRouter);
  protectedRoutes.use("/products", authorizeModule("products.access", "products.catalog.manage"), productsRouter);
  protectedRoutes.use("/barcodes", authorizeModule("products.access", "products.barcodes.manage"), barcodesRouter);
  protectedRoutes.use("/inventory", authorizeModule("inventory.access", "inventory.adjustments.manage"), inventoryRouter);
  protectedRoutes.use("/purchases", authorizeModule("purchases.access", "purchases.orders.manage"), purchasesRouter);
  protectedRoutes.use("/sales", authorizeModule(["sales.access", "sales.history.access"], "sales.new_sale.create"), salesRouter);
  protectedRoutes.use("/customers", authorizeModule("customers.access", "customers.manage"), customersRouter);
  protectedRoutes.use("/users", requirePermission("users.manage"), usersRouter);
  protectedRoutes.use("/notifications", notificationsRouter);
  protectedRoutes.use("/cash", authorizeModule("cash.access", "cash.sessions.manage"), cashRouter);
  app.use("/api", protectedRoutes);
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(error);
      res.status(500).json({
        message: "Unexpected server error",
      });
    },
  );
  return app;
}
