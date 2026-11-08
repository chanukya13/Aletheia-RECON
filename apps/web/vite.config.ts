// Adapted from fastify/fastify-vite e2e/react-vanilla-spa-ts (MIT); see THIRD_PARTY_NOTICES.md.
import { resolve } from "node:path";
import viteFastify from "@fastify/vite/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  root: resolve(import.meta.dirname, "src"),
  plugins: [viteFastify({ spa: true }), react()],
  build: { emptyOutDir: true, outDir: resolve(import.meta.dirname, "dist") },
});
