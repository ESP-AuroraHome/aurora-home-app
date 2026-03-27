import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
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
        "features/**/components/*.tsx",
        "components/specific/*.tsx",
        "components/ui/stepper.tsx",
        "components/ui/spinner.tsx",
        "app/api/**/route.ts",
        "hooks/*.ts",
      ],
      exclude: [
        // infrastructure — no testable logic
        "lib/prisma.ts",
        "lib/auth.ts",
        "lib/auth-client.ts",
        "lib/mqtt-client.ts",
        "app/api/auth/**",
        // server components — require Next.js server runtime
        "components/specific/header.tsx",
        "features/profile/components/ProfileSheetProvider.tsx",
        // pure context connectors — no logic of their own
        "features/notifications/components/DashboardAlertShell.tsx",
        "features/notifications/components/NotificationBellClient.tsx",
        "features/profile/components/ProfilePageContent.tsx",
        "features/profile/components/ProfileSheet.tsx",
        // chart / heavy third-party rendering
        "features/datapoint/components/ChartDatapoint.tsx",
        "**/__tests__/**",
        "**/*.test.ts",
        "**/*.test.tsx",
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
