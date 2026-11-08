import { build } from "vite";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
await build({
  configFile: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: resolve(root, "artifacts/browser/annotation-spike"),
    emptyOutDir: true,
    lib: {
      entry: resolve(root, "apps/web/src/adapters/SourceAnnotationAdapter.ts"),
      name: "ReconSpike",
      formats: ["iife"],
      fileName: () => "adapter.js",
    },
  },
});
