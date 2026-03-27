// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
vi.mock("@/features/notifications/usecase/markAlertRead", () => ({
  markAlertRead: vi.fn(),
  resolveAllAlerts: vi.fn(),
}));
vi.mock("@/features/notifications/usecase/resolveAlert", () => ({
  resolveAlert: vi.fn(),
}));
vi.mock("../AlertCard", () => ({
  default: ({ alert }: { alert: { id: string; severity: string } }) => (
    <div data-testid={`alert-card-${alert.id}`}>{alert.severity}</div>
  ),
}));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({
    children,
    asChild: _asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="sheet-trigger">{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { useTranslations } from "next-intl";
import { resolveAllAlerts } from "@/features/notifications/usecase/markAlertRead";
import type { SerializedAlert } from "@/hooks/useSensorData";
import NotificationSheet from "../NotificationSheet";

const mockResolveAll = vi.mocked(resolveAllAlerts);

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

const defaultProps = {
  alerts: [],
  unreadCount: 0,
  onRead: vi.fn(),
  onResolve: vi.fn(),
  onMarkAllRead: vi.fn(),
  onResolveAll: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as never);
});

describe("NotificationSheet", () => {
  it("renders bell trigger button", () => {
    render(<NotificationSheet {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("shows unread badge count when unreadCount > 0", () => {
    render(<NotificationSheet {...defaultProps} unreadCount={3} />);
    const badges = screen.getAllByText("3");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 9+ when unreadCount > 9", () => {
    render(<NotificationSheet {...defaultProps} unreadCount={15} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("does not show badge when unreadCount is 0", () => {
    render(<NotificationSheet {...defaultProps} unreadCount={0} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows all-sensors-normal banner when no active alerts", () => {
    render(<NotificationSheet {...defaultProps} alerts={[]} />);
    expect(screen.getByText("allSensorsNormal")).toBeInTheDocument();
  });

  it("hides all-sensors-normal banner when there are active alerts", () => {
    render(
      <NotificationSheet
        {...defaultProps}
        alerts={[makeAlert()]}
        unreadCount={1}
      />,
    );
    expect(screen.queryByText("allSensorsNormal")).not.toBeInTheDocument();
  });

  it("shows emptyHealthy when tab is all and no active alerts", () => {
    render(<NotificationSheet {...defaultProps} alerts={[]} />);
    expect(screen.getByText("emptyHealthy")).toBeInTheDocument();
  });

  it("filters to unread tab", async () => {
    const alerts = [
      makeAlert({ id: "a1", read: false }),
      makeAlert({ id: "a2", read: true }),
    ];
    render(
      <NotificationSheet {...defaultProps} alerts={alerts} unreadCount={1} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /tabUnread/i }));
    const content = screen.getByTestId("sheet-content");
    const alertCards = within(content).getAllByRole("button");
    expect(alertCards.length).toBeGreaterThanOrEqual(1);
  });

  it("shows emptyResolved when resolved tab is empty", async () => {
    render(<NotificationSheet {...defaultProps} alerts={[makeAlert()]} />);
    await userEvent.click(screen.getByRole("button", { name: /tabResolved/i }));
    expect(screen.getByText("emptyResolved")).toBeInTheDocument();
  });

  it("calls resolveAllAlerts when marking all as read", async () => {
    mockResolveAll.mockResolvedValue(undefined);
    const onResolveAll = vi.fn();
    render(
      <NotificationSheet
        {...defaultProps}
        alerts={[makeAlert()]}
        onResolveAll={onResolveAll}
      />,
    );
    await userEvent.click(screen.getByText("markAllRead"));
    expect(mockResolveAll).toHaveBeenCalled();
  });
});
