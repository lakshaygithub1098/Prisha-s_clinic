import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errors";
import { requestId } from "./middleware/request-id";
import { connectDatabase } from "./db/connection";
import { healthRouter } from "./routes/v1/health";
import { authRouter } from "./routes/v1/auth";
import { appointmentsRouter } from "./routes/v1/appointments";

export function createApp() {
  const app = express();
  const allowedOrigins = new Set(env.CORS_ORIGINS);

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(requestId);
  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS_ORIGIN_DENIED"));
    },
  }));
  app.use(express.json({ limit: "1mb", strict: true }));
  app.use("/api", rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
  if (process.env.VERCEL) {
    app.use("/api/v1", async (req, _res, next) => {
      if (req.path === "/health" || req.path === "/ready") { next(); return; }
      try { await connectDatabase(); next(); } catch (error) { next(error); }
    });
  }
  app.use("/api/v1", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/appointments", appointmentsRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
