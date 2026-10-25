import { createApp } from "./app.js";
import { config } from "./config/index.js";

const app = createApp();

// This entrypoint is for local development only. Vercel imports the app
// through api/index.ts and invokes it as a serverless function.
if (process.env.VERCEL !== "1") {
  app.listen(config.port, () => {
    console.log(`SwatchNet API server listening on http://localhost:${config.port}`);
  });
}
