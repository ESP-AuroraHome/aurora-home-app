import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/datapoint/repository/dataPointRepository", () => ({
  dataPointRepository: {
    create: vi.fn(),
    findLatestByType: vi.fn(),
  },
}));

vi.mock("@/features/notifications/repository/alertRepository", () => ({
  alertRepository: {
    resolveUnresolvedByType: vi.fn(),
    hasRecentUnresolved: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/anomaly-detector", () => ({
  detectAnomaly: vi.fn(),
  getResolvableAlertTypes: vi.fn(),
  WARMUP_MIN_POINTS: 10,
}));

vi.mock("@/lib/sensor-emitter", () => ({
  sensorEmitter: {
    emit: vi.fn(),
  },
}));

import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import { alertRepository } from "@/features/notifications/repository/alertRepository";
import { detectAnomaly, getResolvableAlertTypes } from "@/lib/anomaly-detector";
import { sensorEmitter } from "@/lib/sensor-emitter";
import { POST } from "../route";

const mockCreate = vi.mocked(dataPointRepository.create);
const mockFindLatest = vi.mocked(dataPointRepository.findLatestByType);
const mockResolveByType = vi.mocked(alertRepository.resolveUnresolvedByType);
const mockHasRecent = vi.mocked(alertRepository.hasRecentUnresolved);
const mockAlertCreate = vi.mocked(alertRepository.create);
const mockDetectAnomaly = vi.mocked(detectAnomaly);
const mockGetResolvable = vi.mocked(getResolvableAlertTypes);
const mockEmit = vi.mocked(sensorEmitter.emit);

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/dev/inject-sensor", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/dev/inject-sensor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 403 in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(makeRequest({ temperature: 25 }));
    expect(response.status).toBe(403);
  });

  it("creates a datapoint and emits sensor_update", async () => {
    const dp = {
      id: "dp1",
      type: "TEMPERATURE" as const,
      value: "25",
      createdAt: new Date(),
    };
    mockCreate.mockResolvedValue(dp as never);
    mockFindLatest.mockResolvedValue(
      Array(12).fill({ value: "24", createdAt: new Date() }),
    );
    mockGetResolvable.mockReturnValue([]);
    mockDetectAnomaly.mockReturnValue(null);

    const response = await POST(makeRequest({ temperature: 25 }));
    const body = await response.json();

    expect(mockCreate).toHaveBeenCalledWith({
      type: "TEMPERATURE",
      value: "25",
    });
    expect(mockEmit).toHaveBeenCalledWith(
      "sensor_update",
      expect.objectContaining({ type: "sensor_update" }),
    );
    expect(body).toEqual({ ok: true });
  });

  it("emits alert_created when anomaly detected after warmup", async () => {
    const dp = {
      id: "dp1",
      type: "TEMPERATURE" as const,
      value: "40",
      createdAt: new Date(),
    };
    const alert = {
      id: "a1",
      type: "THRESHOLD_HIGH" as const,
      severity: "CRITICAL" as const,
      sensorType: "TEMPERATURE" as const,
      value: "40",
      threshold: "28",
      message: "Too hot",
      suggestions: "[]",
      read: false,
      resolvedAt: null,
      createdAt: new Date(),
    };

    mockCreate.mockResolvedValue(dp as never);
    mockFindLatest.mockResolvedValue(
      Array(12).fill({ value: "24", createdAt: new Date() }),
    );
    mockGetResolvable.mockReturnValue([]);
    mockDetectAnomaly.mockReturnValue({
      type: "THRESHOLD_HIGH",
      severity: "CRITICAL",
      sensorType: "TEMPERATURE",
      value: 40,
      threshold: 28,
      message: "Too hot",
      suggestions: [],
    } as never);
    mockHasRecent.mockResolvedValue(false);
    mockAlertCreate.mockResolvedValue(alert as never);

    await POST(makeRequest({ temperature: 40 }));

    expect(mockAlertCreate).toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith(
      "alert_created",
      expect.objectContaining({ type: "alert_created" }),
    );
  });

  it("does not create alert if already alerted recently", async () => {
    const dp = {
      id: "dp1",
      type: "TEMPERATURE" as const,
      value: "40",
      createdAt: new Date(),
    };

    mockCreate.mockResolvedValue(dp as never);
    mockFindLatest.mockResolvedValue(
      Array(12).fill({ value: "24", createdAt: new Date() }),
    );
    mockGetResolvable.mockReturnValue([]);
    mockDetectAnomaly.mockReturnValue({
      type: "THRESHOLD_HIGH",
      severity: "CRITICAL",
      sensorType: "TEMPERATURE",
    } as never);
    mockHasRecent.mockResolvedValue(true);

    await POST(makeRequest({ temperature: 40 }));

    expect(mockAlertCreate).not.toHaveBeenCalled();
  });

  it("emits alerts_auto_resolved when stale alerts are resolved", async () => {
    const dp = {
      id: "dp1",
      type: "TEMPERATURE" as const,
      value: "22",
      createdAt: new Date(),
    };

    mockCreate.mockResolvedValue(dp as never);
    mockFindLatest.mockResolvedValue(
      Array(12).fill({ value: "24", createdAt: new Date() }),
    );
    mockGetResolvable.mockReturnValue(["THRESHOLD_HIGH"] as never);
    mockResolveByType.mockResolvedValue(1);
    mockDetectAnomaly.mockReturnValue(null);

    await POST(makeRequest({ temperature: 22 }));

    expect(mockEmit).toHaveBeenCalledWith(
      "alerts_auto_resolved",
      expect.objectContaining({ type: "alerts_auto_resolved" }),
    );
  });

  it("skips anomaly detection during warmup period", async () => {
    const dp = {
      id: "dp1",
      type: "TEMPERATURE" as const,
      value: "40",
      createdAt: new Date(),
    };

    mockCreate.mockResolvedValue(dp as never);
    mockFindLatest.mockResolvedValue(
      Array(5).fill({ value: "24", createdAt: new Date() }),
    );
    mockGetResolvable.mockReturnValue([]);

    await POST(makeRequest({ temperature: 40 }));

    expect(mockDetectAnomaly).not.toHaveBeenCalled();
  });

  it("ignores unknown sensor keys in the payload", async () => {
    await POST(makeRequest({ unknown_sensor: 99 }));

    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith(
      "sensor_update",
      expect.objectContaining({ type: "sensor_update" }),
    );
  });
});
