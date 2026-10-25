import express, { Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireNeonAuth } from "./middleware/neonAuth.js";
import { config } from "./config/index.js";

export function createApp(): Express {
  const app = express();

  const allowedOrigins = config.corsOrigins;

  app.use(cors({
    origin: (origin, callback) => {
      // Non-browser clients (health checks, curl) have no Origin header.
      if (!origin || process.env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }));
  app.use(express.json());

  // Health checks remain public; every other API path requires verified auth.
  app.use("/api/health", healthRouter);
  app.use("/api/auth", requireNeonAuth, authRouter);
  app.use("/api", requireNeonAuth);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
