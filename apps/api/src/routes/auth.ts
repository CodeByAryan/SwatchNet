import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/neonAuth.js";
import { requireNeonAuth } from "../middleware/neonAuth.js";

export const authRouter = Router();

authRouter.get("/me", requireNeonAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      id: req.auth?.sub,
      email: req.auth?.email,
      name: req.auth?.name,
    },
  });
});
