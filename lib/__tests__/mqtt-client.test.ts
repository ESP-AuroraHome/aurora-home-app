import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Module-level mock fns shared across all re-imports (vi.resetModules keeps factories)
const mockCreate = vi.fn();
const mockFindLatest = vi.fn();
const mockAlertCreate = vi.fn();
const mockHasRecent = vi.fn();
const mockResolveByType = vi.fn();
const mockFindAllPrefs = vi.fn();
const mockFindSettings = vi.fn();
const mockFindAllThresholds = vi.fn();
const mockDetectAnomaly = vi.fn(() => null);
const mockGetResolvable = vi.fn(() => []);
const mockEmit = vi.fn();

let messageHandler:
  | ((topic: string, payload: Buffer) => Promise<void>)
  | undefined;

const mockMqttClient = {
  on: vi.fn((event: string, cb: (...args: unknown[]) => unknown) => {
    if (event === "message") {
      messageHandler = cb as (topic: string, payload: Buffer) => Promise<void>;
    }
  }),
  subscribe: vi.fn((_: string, cb: (err: null) => void) => cb(null)),
};

vi.mock("mqtt", () => ({
  default: { connect: vi.fn(() => mockMqttClient) },
}));
vi.mock("@/features/datapoint/repository/dataPointRepository", () => ({
  dataPointRepository: {
    create: mockCreate,
    findLatestByType: mockFindLatest,
  },
}));
vi.mock("@/features/notifications/repository/alertRepository", () => ({
  alertRepository: {
    create: mockAlertCreate,
    hasRecentUnresolved: mockHasRecent,
    resolveUnresolvedByType: mockResolveByType,
  },
}));
vi.mock(
  "@/features/settings/repository/notificationPreferenceRepository",
  () => ({
    notificationPreferenceRepository: {
      findAllSensorPrefs: mockFindAllPrefs,
      findSettings: mockFindSettings,
    },
  }),
);
vi.mock("@/features/settings/repository/thresholdRepository", () => ({
  thresholdRepository: { findAll: mockFindAllThresholds },
}));
vi.mock("@/lib/anomaly-detector", () => ({
  detectAnomaly: mockDetectAnomaly,
  getResolvableAlertTypes: mockGetResolvable,
  WARMUP_MIN_POINTS: 10,
}));
vi.mock("@/lib/sensor-emitter", () => ({
  sensorEmitter: { emit: mockEmit },
}));

const fakeDatapoint = {
  id: "dp1",
  type: "TEMPERATURE" as const,
  value: "22.5",
  createdAt: new Date(),
  sensorId: "s1",
};

// 11 points = post-warmup (> WARMUP_MIN_POINTS=10)
const postWarmupPoints = Array.from({ length: 11 }, (_, i) => ({
  ...fakeDatapoint,
  id: `dp${i}`,
  value: String(22 + i * 0.1),
}));

// 5 points = warmup mode
const warmupPoints = postWarmupPoints.slice(0, 5);

const fakeAnomaly = {
  type: "THRESHOLD_HIGH" as const,
  severity: "WARNING" as const,
  sensorType: "TEMPERATURE" as const,
  value: 30,
  threshold: 28,
  message: "Temp élevée",
  suggestions: "[]",
  read: false,
  resolvedAt: null,
  createdAt: new Date(),
};

async function sendMessage(data: Record<string, unknown>) {
  await messageHandler?.("sensor/data", Buffer.from(JSON.stringify(data)));
}

describe("startMqttClient", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2124-01-01T12:00:00")); // noon, no quiet hours by default

    mockCreate.mockResolvedValue(fakeDatapoint as never);
    mockFindLatest.mockResolvedValue(postWarmupPoints as never);
    mockHasRecent.mockResolvedValue(false);
    mockResolveByType.mockResolvedValue(0);
    mockAlertCreate.mockResolvedValue({ ...fakeAnomaly, id: "a1" } as never);
    mockFindAllThresholds.mockResolvedValue([]);
    mockFindAllPrefs.mockResolvedValue([]);
    mockFindSettings.mockResolvedValue(null);
    mockDetectAnomaly.mockReturnValue(null);
    mockGetResolvable.mockReturnValue([]);

    // Reset module to clear warmupCompleteEmitted + threshold/prefs caches
    vi.resetModules();
    const { startMqttClient } = await import("../mqtt-client");
    startMqttClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── parseNumericValue (indirect) ──────────────────────────────────────────

  describe("parseNumericValue", () => {
    it("strips unit suffix from raw sensor values", async () => {
      mockFindLatest.mockResolvedValue(warmupPoints as never);
      await sendMessage({ temperature: "22.5°C" });
      expect(mockCreate).toHaveBeenCalledWith({
        type: "TEMPERATURE",
        value: "22.5",
      });
    });

    it("passes through plain numeric strings unchanged", async () => {
      mockFindLatest.mockResolvedValue(warmupPoints as never);
      await sendMessage({ temperature: "22.5" });
      expect(mockCreate).toHaveBeenCalledWith({
        type: "TEMPERATURE",
        value: "22.5",
      });
    });

    it("processes every sensor type present in the payload", async () => {
      mockFindLatest.mockResolvedValue(warmupPoints as never);
      await sendMessage({ temperature: "22.5", humidity: "65", co2: "800" });
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });

  // ── Warmup period ─────────────────────────────────────────────────────────

  describe("warmup period", () => {
    it("skips anomaly detection while warming up", async () => {
      mockFindLatest.mockResolvedValue(warmupPoints as never);
      await sendMessage({ temperature: "22.5" });
      expect(mockDetectAnomaly).not.toHaveBeenCalled();
    });

    it("emits warmup_complete on the first post-warmup message", async () => {
      await sendMessage({ temperature: "22.5" });
      expect(mockEmit).toHaveBeenCalledWith(
        "warmup_complete",
        expect.objectContaining({ type: "warmup_complete" }),
      );
    });

    it("does not re-emit warmup_complete on subsequent messages", async () => {
      await sendMessage({ temperature: "22.5" });
      vi.clearAllMocks();
      mockCreate.mockResolvedValue(fakeDatapoint as never);
      mockFindLatest.mockResolvedValue(postWarmupPoints as never);
      mockHasRecent.mockResolvedValue(false);
      mockResolveByType.mockResolvedValue(0);
      mockFindAllThresholds.mockResolvedValue([]);
      mockFindAllPrefs.mockResolvedValue([]);
      mockFindSettings.mockResolvedValue(null);
      mockDetectAnomaly.mockReturnValue(null);
      mockGetResolvable.mockReturnValue([]);
      await sendMessage({ temperature: "22.5" });
      expect(mockEmit).not.toHaveBeenCalledWith(
        "warmup_complete",
        expect.anything(),
      );
    });
  });

  // ── sensor_update ─────────────────────────────────────────────────────────

  describe("sensor_update event", () => {
    it("emits sensor_update for every processed message", async () => {
      await sendMessage({ temperature: "22.5" });
      expect(mockEmit).toHaveBeenCalledWith(
        "sensor_update",
        expect.objectContaining({ type: "sensor_update" }),
      );
    });
  });

  // ── Alert creation ────────────────────────────────────────────────────────

  describe("alert creation", () => {
    it("creates an alert when an anomaly is detected post-warmup", async () => {
      mockDetectAnomaly.mockReturnValue(fakeAnomaly as never);
      await sendMessage({ temperature: "30" });
      expect(mockAlertCreate).toHaveBeenCalled();
    });

    it("does not create alert when one already exists for this type", async () => {
      mockHasRecent.mockResolvedValue(true);
      mockDetectAnomaly.mockReturnValue(fakeAnomaly as never);
      await sendMessage({ temperature: "30" });
      expect(mockAlertCreate).not.toHaveBeenCalled();
    });

    it("does not create alert when sensor notifications are disabled", async () => {
      mockFindAllPrefs.mockResolvedValue([
        { sensorType: "TEMPERATURE", enabled: false, minSeverity: "WARNING" },
      ] as never);
      mockDetectAnomaly.mockReturnValue(fakeAnomaly as never);
      await sendMessage({ temperature: "30" });
      expect(mockAlertCreate).not.toHaveBeenCalled();
    });

    it("does not create alert when severity is below minSeverity", async () => {
      mockFindAllPrefs.mockResolvedValue([
        { sensorType: "TEMPERATURE", enabled: true, minSeverity: "CRITICAL" },
      ] as never);
      mockDetectAnomaly.mockReturnValue(fakeAnomaly as never); // WARNING < CRITICAL
      await sendMessage({ temperature: "30" });
      expect(mockAlertCreate).not.toHaveBeenCalled();
    });
  });

  // ── isInQuietHours ────────────────────────────────────────────────────────

  describe("isInQuietHours", () => {
    it("suppresses alerts during overnight quiet window (23h inside 22–06)", async () => {
      vi.setSystemTime(new Date("2124-01-01T23:00:00"));
      mockFindSettings.mockResolvedValue({
        quietStart: 22,
        quietEnd: 6,
      } as never);
      mockDetectAnomaly.mockReturnValue(fakeAnomaly as never);
      await sendMessage({ temperature: "30" });
      expect(mockAlertCreate).not.toHaveBeenCalled();
    });

    it("suppresses alerts during daytime quiet window (14h inside 12–18)", async () => {
      vi.setSystemTime(new Date("2124-01-01T14:00:00"));
      mockFindSettings.mockResolvedValue({
        quietStart: 12,
        quietEnd: 18,
      } as never);
      mockDetectAnomaly.mockReturnValue(fakeAnomaly as never);
      await sendMessage({ temperature: "30" });
      expect(mockAlertCreate).not.toHaveBeenCalled();
    });

    it("allows alerts when current hour is outside quiet window", async () => {
      // hour = 12 (noon), quiet window = 22–06
      mockFindSettings.mockResolvedValue({
        quietStart: 22,
        quietEnd: 6,
      } as never);
      mockDetectAnomaly.mockReturnValue(fakeAnomaly as never);
      await sendMessage({ temperature: "30" });
      expect(mockAlertCreate).toHaveBeenCalled();
    });

    it("allows alerts when quiet hours are not configured", async () => {
      mockFindSettings.mockResolvedValue(null);
      mockDetectAnomaly.mockReturnValue(fakeAnomaly as never);
      await sendMessage({ temperature: "30" });
      expect(mockAlertCreate).toHaveBeenCalled();
    });
  });

  // ── Auto-resolve ──────────────────────────────────────────────────────────

  describe("auto-resolve", () => {
    it("calls resolveUnresolvedByType for each resolvable alert type", async () => {
      mockGetResolvable.mockReturnValue(["THRESHOLD_HIGH"] as never);
      await sendMessage({ temperature: "22.5" });
      expect(mockResolveByType).toHaveBeenCalledWith(
        "TEMPERATURE",
        "THRESHOLD_HIGH",
      );
    });

    it("emits alerts_auto_resolved when at least one alert is resolved", async () => {
      mockGetResolvable.mockReturnValue(["THRESHOLD_HIGH"] as never);
      mockResolveByType.mockResolvedValue(1);
      await sendMessage({ temperature: "22.5" });
      expect(mockEmit).toHaveBeenCalledWith(
        "alerts_auto_resolved",
        expect.objectContaining({ type: "alerts_auto_resolved" }),
      );
    });

    it("does not emit alerts_auto_resolved when no alerts were resolved", async () => {
      mockGetResolvable.mockReturnValue(["THRESHOLD_HIGH"] as never);
      mockResolveByType.mockResolvedValue(0);
      await sendMessage({ temperature: "22.5" });
      expect(mockEmit).not.toHaveBeenCalledWith(
        "alerts_auto_resolved",
        expect.anything(),
      );
    });
  });
});
