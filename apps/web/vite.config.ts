import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // The workspace keeps a single .env at the repository root; Vite otherwise
  // looks in apps/web and would never see VITE_* values during dev or build.
  envDir: path.resolve(__dirname, "../../"),
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": process.env.API_PROXY_TARGET || "http://localhost:5000",
    },
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
});
