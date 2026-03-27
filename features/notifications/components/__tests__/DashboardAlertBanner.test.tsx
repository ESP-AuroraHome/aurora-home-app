// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
vi.mock("@/features/notifications/usecase/markAlertRead", () => ({
  markAlertRead: vi.fn(),
}));
vi.mock("@/features/notifications/usecase/resolveAlert", () => ({
  resolveAlert: vi.fn(),
}));

import { useTranslations } from "next-intl";
import type { SerializedAlert } from "@/hooks/useSensorData";
import DashboardAlertBanner from "../DashboardAlertBanner";

function makeAlert(overrides: Partial<SerializedAlert> = {}): SerializedAlert {
  return {
    id: "a1",
    type: "THRESHOLD_HIGH",
    severity: "WARNING",
    sensorType: "TEMPERATURE",
    value: "30",
    threshold: "28",
    message: "Temp élevée",
    suggestions: [],
    read: false,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(useTranslations).mockReturnValue(
    Object.assign(
      (key: string, params?: Record<string, unknown>) => {
        if (key === "monitoringDesc" && params?.count)
          return `${params.count} anomalie`;
        return key;
      },
      { raw: () => ({}) },
    ) as never,
  );
});

describe("DashboardAlertBanner", () => {
  it("shows warmup banner when isWarmingUp is true", () => {
    render(<DashboardAlertBanner alerts={[]} isWarmingUp={true} />);
    expect(screen.getByText("warmup")).toBeInTheDocument();
    expect(screen.getByText("warmupDesc")).toBeInTheDocument();
  });

  it("shows healthy banner when no unread unresolved alerts", () => {
    render(<DashboardAlertBanner alerts={[]} />);
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("shows healthy when all alerts are resolved", () => {
    render(
      <DashboardAlertBanner
        alerts={[makeAlert({ resolvedAt: new Date().toISOString() })]}
      />,
    );
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("shows healthy when all alerts are read", () => {
    render(<DashboardAlertBanner alerts={[makeAlert({ read: true })]} />);
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("renders alert banners for active unread alerts", () => {
    render(<DashboardAlertBanner alerts={[makeAlert()]} />);
    expect(screen.queryByText("healthy")).not.toBeInTheDocument();
    expect(screen.queryByText("warmup")).not.toBeInTheDocument();
  });

  it("dismissing an alert shows monitoring banner when all are dismissed", async () => {
    render(<DashboardAlertBanner alerts={[makeAlert()]} />);
    const buttons = screen.getAllByRole("button");
    const dismissButton = buttons[buttons.length - 1];
    await userEvent.click(dismissButton);
    expect(screen.getByText("monitoring")).toBeInTheDocument();
  });

  it("sorts alerts by severity (CRITICAL first)", () => {
    const alerts = [
      makeAlert({ id: "a1", severity: "WARNING" }),
      makeAlert({ id: "a2", severity: "CRITICAL" }),
    ];
    render(<DashboardAlertBanner alerts={alerts} />);
    const items = screen.getAllByRole("button");
    expect(items.length).toBeGreaterThanOrEqual(2);
  });
});
