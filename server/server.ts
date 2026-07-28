import "dotenv/config";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { inventoryRouter } from "./modules/inventory/inventory.routes.js";
import { purchasesRouter } from "./modules/purchases/purchases.routes.js";
import { salesRouter } from "./modules/sales/sales.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { requireAuthentication } from "./modules/auth/auth.middleware.js";

const app = express();
const allowedOrigins = new Set([env.CLIENT_URL, ...env.CORS_ORIGINS]);
app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without Origin (health checks, server-to-server calls) remain valid.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Origen no autorizado."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/auth", authRouter);
// Every ERP resource requires a verified JWT; UI guards are not the security boundary.
app.use("/api/dashboard", requireAuthentication, dashboardRouter);
app.use("/api/products", requireAuthentication, productsRouter);
app.use("/api/inventory", requireAuthentication, inventoryRouter);
app.use("/api/purchases", requireAuthentication, purchasesRouter);
app.use("/api/sales", requireAuthentication, salesRouter);
app.use("/api/users", requireAuthentication, usersRouter);
app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    response.status(500).json({ message: "Unexpected server error" });
  },
);
app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
