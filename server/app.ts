import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { inventoryRouter } from "./modules/inventory/inventory.routes.js";
import { purchasesRouter } from "./modules/purchases/purchases.routes.js";
import { salesRouter } from "./modules/sales/sales.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { customersRouter } from "./modules/customers/customers.routes.js";
import { barcodesRouter } from "./modules/barcodes/barcodes.routes.js";
import { requireAuthentication } from "./modules/auth/auth.middleware.js";
import { cashRouter } from "./modules/cash/cash.routes.js";

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

  protectedRoutes.use(requireAuthentication);
  protectedRoutes.use("/dashboard", dashboardRouter);
  protectedRoutes.use("/products", productsRouter);
  protectedRoutes.use("/barcodes", barcodesRouter);
  protectedRoutes.use("/inventory", inventoryRouter);
  protectedRoutes.use("/purchases", purchasesRouter);
  protectedRoutes.use("/sales", salesRouter);
  protectedRoutes.use("/customers", customersRouter);
  protectedRoutes.use("/users", usersRouter);
  protectedRoutes.use("/notifications", notificationsRouter);
  protectedRoutes.use("/cash", cashRouter);
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
