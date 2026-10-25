import { createApp } from "../apps/api/src/app.js";

// Vercel detects this Express export and adapts it to a Node.js Function.
// Routes in Express retain their existing /api prefix.
const app = createApp();
export default app;
