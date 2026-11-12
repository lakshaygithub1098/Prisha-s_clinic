import { Router } from "express";
import { env } from "../../config/env";
import { isDatabaseConnected } from "../../db/connection";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    data: {
      status: "ok",
      service: "prisha-clinic-api",
      apiVersion: "v1",
      database: isDatabaseConnected() ? "connected" : env.MONGODB_URI ? "disconnected" : "not_configured",
      timestamp: new Date().toISOString(),
    },
  });
});

healthRouter.get("/ready", (_req, res) => {
  const ready = isDatabaseConnected();
  res.status(ready ? 200 : 503).json({
    data: {
      status: ready ? "ready" : "not_ready",
      database: isDatabaseConnected() ? "connected" : env.MONGODB_URI ? "disconnected" : "not_configured",
      timestamp: new Date().toISOString(),
    },
  });
});
