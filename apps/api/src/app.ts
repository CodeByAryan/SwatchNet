import express, { Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(): Express {
  const app = express();

  if (process.env.NODE_ENV !== "production") {
    app.use(cors());
  }
  app.use(express.json());

  // API Routes
  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
