import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/datapoint/repository/dataPointRepository", () => ({
  dataPointRepository: {
    findLatestByType: vi.fn(),
  },
}));

import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import { getInitialDataPoints } from "../getInitialDataPoints";

const mockRepo = dataPointRepository as unknown as {
  findLatestByType: ReturnType<typeof vi.fn>;
};

const DATA_TYPES = ["TEMPERATURE", "HUMIDITY", "PRESSURE", "CO2", "LIGHT"];

describe("getInitialDataPoints", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches 20 latest data points for each sensor type", async () => {
    mockRepo.findLatestByType.mockResolvedValue([]);
    await getInitialDataPoints();
    for (const type of DATA_TYPES) {
      expect(mockRepo.findLatestByType).toHaveBeenCalledWith(type, 20);
    }
  });

  it("returns a record keyed by DataType with ISO-serialized createdAt", async () => {
    const date = new Date("2024-06-01T10:00:00Z");
    mockRepo.findLatestByType.mockResolvedValue([
      { id: "dp-1", type: "TEMPERATURE", value: "25", createdAt: date },
    ]);

    const result = await getInitialDataPoints();

    for (const type of DATA_TYPES) {
      expect(result[type as keyof typeof result]).toBeDefined();
      expect(result[type as keyof typeof result][0].createdAt).toBe(
        date.toISOString(),
      );
    }
  });

  it("returns empty arrays when no data points exist", async () => {
    mockRepo.findLatestByType.mockResolvedValue([]);
    const result = await getInitialDataPoints();
    for (const type of DATA_TYPES) {
      expect(result[type as keyof typeof result]).toEqual([]);
    }
  });
});
