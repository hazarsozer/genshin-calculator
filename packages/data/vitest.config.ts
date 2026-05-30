import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // Resolve workspace deps from source so tests run without a prior build.
      "@genshin/types": fileURLToPath(
        new URL("../types/src/index.ts", import.meta.url)
      ),
      "@genshin/core": fileURLToPath(
        new URL("../core/src/index.ts", import.meta.url)
      ),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // index.ts is a pure re-export barrel; __tests__ holds tests + fixtures.
      exclude: ["src/**/*.test.ts", "src/**/__tests__/**", "src/index.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
