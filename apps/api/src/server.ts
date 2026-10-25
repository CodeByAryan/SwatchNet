import { createApp } from "./app.js";
import { config } from "./config/index.js";

const app = createApp();

// Local development and Render both run the persistent Express server.
app.listen(config.port, "0.0.0.0", () => {
  console.log(`SwatchNet API server listening on port ${config.port}`);
});
