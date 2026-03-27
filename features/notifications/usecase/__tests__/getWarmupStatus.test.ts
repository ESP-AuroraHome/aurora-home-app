import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/datapoint/repository/dataPointRepository", () => ({
  dataPointRepository: {
    findLatestByType: vi.fn(),
  },
}));

import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import { WARMUP_MIN_POINTS } from "@/lib/anomaly-detector";
import { getWarmupStatus } from "../getWarmupStatus";

const mockRepo = dataPointRepository as unknown as {
  findLatestByType: ReturnType<typeof vi.fn>;
};

const SENSOR_TYPES = ["TEMPERATURE", "HUMIDITY", "CO2", "PRESSURE", "LIGHT"];
const makeDataPoints = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: String(i) }));

describe("getWarmupStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when no sensor has any data (system just started)", async () => {
    mockRepo.findLatestByType.mockResolvedValue([]);
    const result = await getWarmupStatus();
    expect(result).toBe(true);
  });

  it("returns true when some active sensors have fewer than WARMUP_MIN_POINTS data points", async () => {
    mockRepo.findLatestByType.mockImplementation((type: string) => {
      if (type === "TEMPERATURE") return Promise.resolve(makeDataPoints(50));
      return Promise.resolve([]);
    });
    const result = await getWarmupStatus();
    expect(result).toBe(true);
  });

  it("returns false when all active sensors have reached WARMUP_MIN_POINTS", async () => {
    mockRepo.findLatestByType.mockResolvedValue(
      makeDataPoints(WARMUP_MIN_POINTS + 1),
    );
    const result = await getWarmupStatus();
    expect(result).toBe(false);
  });

  it("queries each sensor type with WARMUP_MIN_POINTS + 1 limit", async () => {
    mockRepo.findLatestByType.mockResolvedValue(
      makeDataPoints(WARMUP_MIN_POINTS + 1),
    );
    await getWarmupStatus();
    expect(mockRepo.findLatestByType).toHaveBeenCalledTimes(
      SENSOR_TYPES.length,
    );
    expect(mockRepo.findLatestByType).toHaveBeenCalledWith(
      expect.any(String),
      WARMUP_MIN_POINTS + 1,
    );
  });

  it("ignores inactive sensors (0 data points) when calculating warmup", async () => {
    mockRepo.findLatestByType.mockImplementation((type: string) => {
      if (type === "TEMPERATURE")
        return Promise.resolve(makeDataPoints(WARMUP_MIN_POINTS + 1));
      return Promise.resolve([]);
    });
    const result = await getWarmupStatus();
    expect(result).toBe(false);
  });
});
