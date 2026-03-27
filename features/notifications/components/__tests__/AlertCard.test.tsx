// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
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
import { markAlertRead } from "@/features/notifications/usecase/markAlertRead";
import { resolveAlert } from "@/features/notifications/usecase/resolveAlert";
import AlertCard from "../AlertCard";

const mockMarkAlertRead = vi.mocked(markAlertRead);
const mockResolveAlert = vi.mocked(resolveAlert);

function makeAlert(overrides = {}) {
  return {
    id: "a1",
    type: "THRESHOLD_HIGH" as const,
    severity: "WARNING" as const,
    sensorType: "TEMPERATURE" as const,
    value: "30",
    threshold: "28",
    message: "Température élevée",
    suggestions: [],
    read: false,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useTranslations).mockImplementation(
    (ns?: string) =>
      ((key: string, _params?: unknown) => {
        if (ns === "alerts") {
          if (key === "thresholdHigh") return "Température élevée";
          if (key === "thresholdLow") return "Température basse";
          if (key === "suddenChange") return "Variation soudaine";
          if (key.startsWith("sensors.")) return key.split(".")[1];
          if (key.startsWith("suggestions.")) return null;
        }
        if (ns === "notifications") {
          if (key === "resolve") return "Marquer comme résolu";
          if (key === "justNow") return "À l'instant";
          if (key === "severityWarning") return "Attention";
          if (key === "severityHigh") return "Problème";
          if (key === "severityCritical") return "Urgent";
        }
        return key;
      }) as never,
  );

  vi.mocked(useTranslations).mockImplementation(
    (ns?: string) =>
      Object.assign(
        (key: string, _params?: unknown) => {
          const map: Record<string, string> = {
            thresholdHigh: "Température élevée",
            thresholdLow: "Température basse",
            suddenChange: "Variation soudaine",
            resolve: "Marquer comme résolu",
            justNow: "À l'instant",
            severityWarning: "Attention",
            severityHigh: "Problème",
            severityCritical: "Urgent",
            [`sensors.TEMPERATURE`]: "Température",
            [`sensors.HUMIDITY`]: "Humidité",
          };
          return map[key] ?? key;
        },
        {
          raw: (_key: string) => ({}),
        },
      ) as never,
  );
});

describe("AlertCard", () => {
  it("renders the alert message", () => {
    render(
      <AlertCard alert={makeAlert()} onRead={vi.fn()} onResolve={vi.fn()} />,
    );
    expect(screen.getByText("Température élevée")).toBeInTheDocument();
  });

  it("shows the resolve button for unresolved alerts", () => {
    render(
      <AlertCard alert={makeAlert()} onRead={vi.fn()} onResolve={vi.fn()} />,
    );
    expect(screen.getByText("Marquer comme résolu")).toBeInTheDocument();
  });

  it("does not show resolve button when already resolved", () => {
    render(
      <AlertCard
        alert={makeAlert({ resolvedAt: new Date().toISOString() })}
        onRead={vi.fn()}
        onResolve={vi.fn()}
      />,
    );
    expect(screen.queryByText("Marquer comme résolu")).not.toBeInTheDocument();
  });

  it("calls markAlertRead when clicking an unread alert", async () => {
    mockMarkAlertRead.mockResolvedValue(undefined);
    const onRead = vi.fn();
    render(
      <AlertCard alert={makeAlert()} onRead={onRead} onResolve={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /température/i }));
    await waitFor(() => {
      expect(mockMarkAlertRead).toHaveBeenCalledWith("a1");
      expect(onRead).toHaveBeenCalledWith("a1");
    });
  });

  it("does not call markAlertRead when alert already read", async () => {
    render(
      <AlertCard
        alert={makeAlert({ read: true })}
        onRead={vi.fn()}
        onResolve={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /température/i }));
    expect(mockMarkAlertRead).not.toHaveBeenCalled();
  });

  it("calls resolveAlert when clicking resolve button", async () => {
    mockResolveAlert.mockResolvedValue(undefined);
    const onResolve = vi.fn();
    render(
      <AlertCard alert={makeAlert()} onRead={vi.fn()} onResolve={onResolve} />,
    );
    await userEvent.click(screen.getByText("Marquer comme résolu"));
    await waitFor(() => {
      expect(mockResolveAlert).toHaveBeenCalledWith("a1");
      expect(onResolve).toHaveBeenCalledWith("a1");
    });
  });
});
