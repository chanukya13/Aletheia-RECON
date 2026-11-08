import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          maxWorkers: 2,
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          maxWorkers: 1,
          fileParallelism: false,
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          testTimeout: 15000,
        },
      },
    ],
  },
});
