import type { DataPoint, DataType } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dataPointRepository = {
  async findLatestByType(
    type: DataType,
    take: number = 20,
  ): Promise<DataPoint[]> {
    return prisma.dataPoint.findMany({
      orderBy: { createdAt: "desc" },
      where: { type: { equals: type } },
      take,
    });
  },

  async findByTypeSince(type: DataType, since: Date): Promise<DataPoint[]> {
    return prisma.dataPoint.findMany({
      orderBy: { createdAt: "asc" },
      where: { type: { equals: type }, createdAt: { gte: since } },
    });
  },

  async create(data: { type: DataType; value: string }): Promise<DataPoint> {
    return prisma.dataPoint.create({ data });
  },
};
