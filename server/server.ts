import "dotenv/config";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";

const app = express();
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
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
