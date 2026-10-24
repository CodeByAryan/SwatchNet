import express, { Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use("/api", healthRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
