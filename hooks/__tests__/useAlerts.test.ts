// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAlerts } from "../useAlerts";

type MockEventSource = {
  onmessage: ((e: { data: string }) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
};

let mockEs: MockEventSource;

beforeEach(() => {
  mockEs = { onmessage: null, onerror: null, close: vi.fn() };
  vi.stubGlobal(
    "EventSource",
    // biome-ignore lint/complexity/useArrowFunction: needs to work as a constructor
    vi.fn(function () {
      return mockEs;
    }),
  );
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function emit(type: string, data: object) {
  act(() => {
    mockEs.onmessage?.({ data: JSON.stringify({ type, data }) });
  });
}

function makeAlert(overrides = {}) {
  return {
    id: "a1",
    type: "THRESHOLD_HIGH" as const,
    severity: "WARNING" as const,
    sensorType: "TEMPERATURE" as const,
    value: 30,
    threshold: 28,
    message: "Temp élevée",
    suggestions: [],
    read: false,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("useAlerts", () => {
  it("initializes with provided alerts", () => {
    const initial = [makeAlert()];
    const { result } = renderHook(() => useAlerts(initial));
    expect(result.current.alerts).toHaveLength(1);
  });

  it("connects to EventSource on mount", () => {
    renderHook(() => useAlerts());
    expect(EventSource).toHaveBeenCalledWith("/api/sensor-stream");
  });

  it("closes EventSource on unmount", () => {
    const { unmount } = renderHook(() => useAlerts());
    unmount();
    expect(mockEs.close).toHaveBeenCalled();
  });

  it("prepends new alert on alert_created event", () => {
    const { result } = renderHook(() => useAlerts());
    emit("alert_created", makeAlert({ id: "new" }));
    expect(result.current.alerts[0].id).toBe("new");
  });

  it("auto-resolves alerts on alerts_auto_resolved event", () => {
    const initial = [makeAlert({ id: "a1", sensorType: "TEMPERATURE" })];
    const { result } = renderHook(() => useAlerts(initial));
    emit("alerts_auto_resolved", { sensorType: "TEMPERATURE" });
    expect(result.current.alerts[0].resolvedAt).not.toBeNull();
    expect(result.current.alerts[0].read).toBe(true);
  });

  it("does not auto-resolve alerts for other sensor types", () => {
    const initial = [makeAlert({ id: "a1", sensorType: "TEMPERATURE" })];
    const { result } = renderHook(() => useAlerts(initial));
    emit("alerts_auto_resolved", { sensorType: "CO2" });
    expect(result.current.alerts[0].resolvedAt).toBeNull();
  });

  it("sets isWarmingUp to false on warmup_complete event", () => {
    const { result } = renderHook(() => useAlerts([], true));
    expect(result.current.isWarmingUp).toBe(true);
    emit("warmup_complete", {});
    expect(result.current.isWarmingUp).toBe(false);
  });

  it("marks alert as read with markAlertRead", () => {
    const initial = [makeAlert({ id: "a1", read: false })];
    const { result } = renderHook(() => useAlerts(initial));
    act(() => result.current.markAlertRead("a1"));
    expect(result.current.alerts[0].read).toBe(true);
  });

  it("resolves alert locally with resolveAlertLocally", () => {
    const initial = [makeAlert({ id: "a1" })];
    const { result } = renderHook(() => useAlerts(initial));
    act(() => result.current.resolveAlertLocally("a1"));
    expect(result.current.alerts[0].resolvedAt).not.toBeNull();
    expect(result.current.alerts[0].read).toBe(true);
  });

  it("marks all alerts read with markAllReadLocally", () => {
    const initial = [makeAlert({ id: "a1" }), makeAlert({ id: "a2" })];
    const { result } = renderHook(() => useAlerts(initial));
    act(() => result.current.markAllReadLocally());
    expect(result.current.alerts.every((a) => a.read)).toBe(true);
  });

  it("resolves all alerts with resolveAllLocally", () => {
    const initial = [makeAlert({ id: "a1" }), makeAlert({ id: "a2" })];
    const { result } = renderHook(() => useAlerts(initial));
    act(() => result.current.resolveAllLocally());
    expect(result.current.alerts.every((a) => a.resolvedAt !== null)).toBe(
      true,
    );
  });

  it("computes unreadCount correctly", () => {
    const initial = [
      makeAlert({ id: "a1", read: false, resolvedAt: null }),
      makeAlert({ id: "a2", read: true, resolvedAt: null }),
      makeAlert({
        id: "a3",
        read: false,
        resolvedAt: new Date().toISOString(),
      }),
    ];
    const { result } = renderHook(() => useAlerts(initial));
    expect(result.current.unreadCount).toBe(1);
  });

  it("reconnects after EventSource error", () => {
    renderHook(() => useAlerts());
    act(() => mockEs.onerror?.());
    act(() => vi.advanceTimersByTime(3000));
    expect(EventSource).toHaveBeenCalledTimes(2);
  });
});
