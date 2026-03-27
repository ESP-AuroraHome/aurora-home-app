// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSensorData } from "../useSensorData";

type MockEventSource = {
  onopen: (() => void) | null;
  onmessage: ((e: { data: string }) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
};

let mockEs: MockEventSource;

const emptyData = {
  TEMPERATURE: [],
  HUMIDITY: [],
  PRESSURE: [],
  CO2: [],
  LIGHT: [],
} as never;

beforeEach(() => {
  mockEs = {
    onopen: null,
    onmessage: null,
    onerror: null,
    close: vi.fn(),
  };
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
    type: "THRESHOLD_HIGH",
    severity: "WARNING",
    sensorType: "TEMPERATURE",
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

describe("useSensorData", () => {
  it("initializes with provided data and alerts", () => {
    const { result } = renderHook(() =>
      useSensorData(emptyData, [makeAlert() as never]),
    );
    expect(result.current.alerts).toHaveLength(1);
  });

  it("connects to EventSource on mount", () => {
    renderHook(() => useSensorData(emptyData));
    expect(EventSource).toHaveBeenCalledWith("/api/sensor-stream");
  });

  it("closes EventSource on unmount", () => {
    const { unmount } = renderHook(() => useSensorData(emptyData));
    unmount();
    expect(mockEs.close).toHaveBeenCalled();
  });

  it("prepends sensor data on sensor_update event", () => {
    const { result } = renderHook(() => useSensorData(emptyData));
    emit("sensor_update", {
      TEMPERATURE: {
        id: "dp1",
        type: "TEMPERATURE",
        value: "22",
        createdAt: new Date().toISOString(),
      },
    });
    expect(result.current.data.TEMPERATURE).toHaveLength(1);
    expect(result.current.data.TEMPERATURE[0].value).toBe("22");
  });

  it("keeps at most 20 datapoints per type", () => {
    const initial = {
      ...emptyData,
      TEMPERATURE: Array.from({ length: 20 }, (_, i) => ({
        id: `dp${i}`,
        type: "TEMPERATURE" as const,
        value: String(i),
        createdAt: new Date().toISOString(),
      })),
    };
    const { result } = renderHook(() => useSensorData(initial));
    emit("sensor_update", {
      TEMPERATURE: {
        id: "dp20",
        type: "TEMPERATURE",
        value: "99",
        createdAt: new Date().toISOString(),
      },
    });
    expect(result.current.data.TEMPERATURE).toHaveLength(20);
    expect(result.current.data.TEMPERATURE[0].value).toBe("99");
  });

  it("prepends new alert on alert_created event", () => {
    const { result } = renderHook(() => useSensorData(emptyData));
    emit("alert_created", makeAlert({ id: "new" }));
    expect(result.current.alerts[0].id).toBe("new");
  });

  it("marks alert read with markAlertRead", () => {
    const { result } = renderHook(() =>
      useSensorData(emptyData, [makeAlert({ read: false }) as never]),
    );
    act(() => result.current.markAlertRead("a1"));
    expect(result.current.alerts[0].read).toBe(true);
  });

  it("resolves alert locally with resolveAlertLocally", () => {
    const { result } = renderHook(() =>
      useSensorData(emptyData, [makeAlert() as never]),
    );
    act(() => result.current.resolveAlertLocally("a1"));
    expect(result.current.alerts[0].resolvedAt).not.toBeNull();
    expect(result.current.alerts[0].read).toBe(true);
  });

  it("marks all alerts read with markAllReadLocally", () => {
    const alerts = [
      makeAlert({ id: "a1" }),
      makeAlert({ id: "a2" }),
    ] as never[];
    const { result } = renderHook(() => useSensorData(emptyData, alerts));
    act(() => result.current.markAllReadLocally());
    expect(result.current.alerts.every((a) => a.read)).toBe(true);
  });

  it("computes unreadCount for unresolved unread alerts", () => {
    const alerts = [
      makeAlert({ id: "a1", read: false }),
      makeAlert({ id: "a2", read: true }),
    ] as never[];
    const { result } = renderHook(() => useSensorData(emptyData, alerts));
    expect(result.current.unreadCount).toBe(1);
  });

  it("reconnects after EventSource error", () => {
    renderHook(() => useSensorData(emptyData));
    act(() => mockEs.onerror?.());
    act(() => vi.advanceTimersByTime(3000));
    expect(EventSource).toHaveBeenCalledTimes(2);
  });
});
