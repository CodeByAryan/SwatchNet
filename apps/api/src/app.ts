import express, { Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { reportsRouter } from "./routes/reports.js";
import { tasksRouter } from "./routes/tasks.js";
import { applicationsRouter } from "./routes/applications.js";
import { dashboardRouter } from "./routes/dashboard.js";
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
      // Rejecting via a thrown error would surface as a 500; deny as 403 instead.
      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  }));

  // Browsers omitting an allowed Origin get no CORS headers above; answer clearly.
  app.use((req, res, next) => {
    const origin = req.header("origin");
    if (
      origin &&
      process.env.NODE_ENV === "production" &&
      !allowedOrigins.includes(origin)
    ) {
      res.status(403).json({
        success: false,
        error: { message: "Origin is not allowed by CORS" },
      });
      return;
    }
    next();
  });
  // Photo evidence may be sent as a compact inline data URL (stored as text).
  app.use(express.json({ limit: "4mb" }));

  // Health checks remain public; every other API path requires verified auth.
  // Public liveness & readiness endpoints mounted before the authenticated /api gate.
  app.use("/api/health", healthRouter);
  app.use("/health", healthRouter);

  // Neon Auth SDK JWT is verified on every request; roles are resolved from DB.
  app.use("/api/auth", requireNeonAuth, authRouter);

  // Everything after this point is authenticated. Each router then applies its
  // own role guard and record-ownership checks; the frontend is never trusted.
  app.use("/api", requireNeonAuth);
  app.use("/api/users", usersRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/applications", applicationsRouter);
  app.use("/api/dashboard", dashboardRouter);

  // Reaching here unauthenticated means the path is not a real route (e.g. a
  // stray Vite proxy call): answer 404 instead of a confusing 401.
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { message: "Not found." } });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
