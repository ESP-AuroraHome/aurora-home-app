import type { DataType, Severity, SystemThreshold } from "@prisma/client";
import prisma from "@/lib/prisma";

export type ThresholdInput = {
  sensorType: DataType;
  highValue?: number | null;
  highSeverity?: Severity | null;
  lowValue?: number | null;
  lowSeverity?: Severity | null;
};

export const thresholdRepository = {
  async findAll(): Promise<SystemThreshold[]> {
    return prisma.systemThreshold.findMany();
  },

  async upsert(data: ThresholdInput): Promise<SystemThreshold> {
    return prisma.systemThreshold.upsert({
      where: { sensorType: data.sensorType },
      update: {
        highValue: data.highValue ?? null,
        highSeverity: data.highSeverity ?? null,
        lowValue: data.lowValue ?? null,
        lowSeverity: data.lowSeverity ?? null,
      },
      create: {
        sensorType: data.sensorType,
        highValue: data.highValue ?? null,
        highSeverity: data.highSeverity ?? null,
        lowValue: data.lowValue ?? null,
        lowSeverity: data.lowSeverity ?? null,
      },
    });
  },

  async deleteForType(sensorType: DataType): Promise<void> {
    await prisma.systemThreshold.deleteMany({ where: { sensorType } });
  },
};
