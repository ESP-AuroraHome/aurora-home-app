import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportsDirectory: "./coverage",
      reportOnFailure: true,
      all: true,
      include: [
        "lib/**/*.ts",
        "features/**/repository/*.ts",
        "features/**/usecase/*.ts",
        "features/**/utils/*.ts",
        "app/api/**/route.ts",
      ],
      exclude: [
        "lib/prisma.ts",
        "lib/auth.ts",
        "lib/auth-client.ts",
        "lib/mqtt-client.ts",
        "lib/sensor-emitter.ts",
        "app/api/auth/**",
        "**/inject-sensor/**",
        "app/api/sensor-stream/**",
        "**/__tests__/**",
        "**/*.test.ts",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
