import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: import.meta.dirname,
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    assetsDir: "assets",
    copyPublicDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4174,
  },
});
