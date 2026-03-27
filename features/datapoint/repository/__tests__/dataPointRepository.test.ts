import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    dataPoint: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { dataPointRepository } from "../dataPointRepository";

const mockDataPoint = prisma.dataPoint as unknown as {
  findMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

describe("dataPointRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("findLatestByType", () => {
    it("queries the last 20 data points by type in desc order by default", async () => {
      mockDataPoint.findMany.mockResolvedValue([]);
      await dataPointRepository.findLatestByType("TEMPERATURE");
      expect(mockDataPoint.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        where: { type: { equals: "TEMPERATURE" } },
        take: 20,
      });
    });

    it("uses custom take when provided", async () => {
      mockDataPoint.findMany.mockResolvedValue([]);
      await dataPointRepository.findLatestByType("CO2", 50);
      expect(mockDataPoint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  describe("findByTypeSince", () => {
    it("queries data points since a given date in asc order", async () => {
      const since = new Date("2024-01-01");
      mockDataPoint.findMany.mockResolvedValue([]);
      await dataPointRepository.findByTypeSince("HUMIDITY", since);
      expect(mockDataPoint.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "asc" },
        where: { type: { equals: "HUMIDITY" }, createdAt: { gte: since } },
      });
    });
  });

  describe("create", () => {
    it("creates a data point with given type and value", async () => {
      const dp = { id: "dp-1", type: "TEMPERATURE", value: "25.5" };
      mockDataPoint.create.mockResolvedValue(dp);
      const result = await dataPointRepository.create({
        type: "TEMPERATURE",
        value: "25.5",
      });
      expect(result).toEqual(dp);
      expect(mockDataPoint.create).toHaveBeenCalledWith({
        data: { type: "TEMPERATURE", value: "25.5" },
      });
    });
  });
});
