import express from "express";
import { healthRouter } from "./src/routes/health.ts";

// Hypothesis: `express.json()` (or the CORS layer) changes how the mounted
// router is stripped. Test each addition independently against the bare case.
const variants: Record<string, (app: express.Express) => void> = {
  bare: () => { },
  withJson: (app) => app.use(express.json()),
  withCors: (app) => app.use((req, _res, next) => { void req.headers.origin; next(); }),
};

for (const [name, setup] of Object.entries(variants)) {
  const app = express();
  setup(app);
  app.use("/api/health", healthRouter);
  app.use("/api", (_req, res) => res.status(401).json({ gated: true }));

  await new Promise<void>((resolve) => {
    const server = app.listen(0, "127.0.0.1", async () => {
      const port = (server.address() as { port: number }).port;
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      console.log(`${name}: ${res.status} ${(await res.text()).slice(0, 60)}`);
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });
}
