import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    systemThreshold: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { thresholdRepository } from "../thresholdRepository";

const mockThreshold = prisma.systemThreshold as unknown as {
  findMany: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
};

describe("thresholdRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("findAll", () => {
    it("returns all system thresholds", async () => {
      mockThreshold.findMany.mockResolvedValue([{ sensorType: "CO2" }]);
      const result = await thresholdRepository.findAll();
      expect(result).toEqual([{ sensorType: "CO2" }]);
      expect(mockThreshold.findMany).toHaveBeenCalled();
    });
  });

  describe("upsert", () => {
    it("upserts a threshold with all values", async () => {
      mockThreshold.upsert.mockResolvedValue({});
      await thresholdRepository.upsert({
        sensorType: "TEMPERATURE",
        highValue: 35,
        highSeverity: "HIGH",
        lowValue: 10,
        lowSeverity: "WARNING",
      });
      expect(mockThreshold.upsert).toHaveBeenCalledWith({
        where: { sensorType: "TEMPERATURE" },
        update: {
          highValue: 35,
          highSeverity: "HIGH",
          lowValue: 10,
          lowSeverity: "WARNING",
        },
        create: {
          sensorType: "TEMPERATURE",
          highValue: 35,
          highSeverity: "HIGH",
          lowValue: 10,
          lowSeverity: "WARNING",
        },
      });
    });

    it("defaults undefined values to null", async () => {
      mockThreshold.upsert.mockResolvedValue({});
      await thresholdRepository.upsert({ sensorType: "CO2" });
      expect(mockThreshold.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            highValue: null,
            highSeverity: null,
            lowValue: null,
            lowSeverity: null,
          },
        }),
      );
    });
  });

  describe("deleteForType", () => {
    it("deletes thresholds for the given sensor type", async () => {
      mockThreshold.deleteMany.mockResolvedValue({ count: 1 });
      await thresholdRepository.deleteForType("PRESSURE");
      expect(mockThreshold.deleteMany).toHaveBeenCalledWith({
        where: { sensorType: "PRESSURE" },
      });
    });
  });
});
