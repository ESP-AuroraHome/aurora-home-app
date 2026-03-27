import type {
  DataType,
  NotificationSettings,
  SensorPreference,
  Severity,
} from "@prisma/client";
import prisma from "@/lib/prisma";

export const notificationPreferenceRepository = {
  async findAllSensorPrefs(): Promise<SensorPreference[]> {
    return prisma.sensorPreference.findMany();
  },

  async upsertSensorPref(data: {
    sensorType: DataType;
    enabled: boolean;
    minSeverity: Severity;
  }): Promise<SensorPreference> {
    return prisma.sensorPreference.upsert({
      where: { sensorType: data.sensorType },
      update: { enabled: data.enabled, minSeverity: data.minSeverity },
      create: {
        sensorType: data.sensorType,
        enabled: data.enabled,
        minSeverity: data.minSeverity,
      },
    });
  },

  async findSettings(): Promise<NotificationSettings | null> {
    return prisma.notificationSettings.findUnique({ where: { id: "default" } });
  },

  async upsertSettings(data: {
    quietStart: number | null;
    quietEnd: number | null;
  }): Promise<NotificationSettings> {
    return prisma.notificationSettings.upsert({
      where: { id: "default" },
      update: { quietStart: data.quietStart, quietEnd: data.quietEnd },
      create: {
        id: "default",
        quietStart: data.quietStart,
        quietEnd: data.quietEnd,
      },
    });
  },
};
