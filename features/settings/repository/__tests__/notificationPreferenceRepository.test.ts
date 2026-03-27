import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    sensorPreference: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    notificationSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { notificationPreferenceRepository } from "../notificationPreferenceRepository";

const mockSensorPref = prisma.sensorPreference as unknown as {
  findMany: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};
const mockNotifSettings = prisma.notificationSettings as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};

describe("notificationPreferenceRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("findAllSensorPrefs", () => {
    it("returns all sensor preferences", async () => {
      mockSensorPref.findMany.mockResolvedValue([{ sensorType: "CO2" }]);
      const result =
        await notificationPreferenceRepository.findAllSensorPrefs();
      expect(result).toEqual([{ sensorType: "CO2" }]);
      expect(mockSensorPref.findMany).toHaveBeenCalled();
    });
  });

  describe("upsertSensorPref", () => {
    it("upserts a sensor preference", async () => {
      mockSensorPref.upsert.mockResolvedValue({});
      await notificationPreferenceRepository.upsertSensorPref({
        sensorType: "TEMPERATURE",
        enabled: true,
        minSeverity: "WARNING",
      });
      expect(mockSensorPref.upsert).toHaveBeenCalledWith({
        where: { sensorType: "TEMPERATURE" },
        update: { enabled: true, minSeverity: "WARNING" },
        create: {
          sensorType: "TEMPERATURE",
          enabled: true,
          minSeverity: "WARNING",
        },
      });
    });
  });

  describe("findSettings", () => {
    it("finds notification settings by default id", async () => {
      mockNotifSettings.findUnique.mockResolvedValue(null);
      await notificationPreferenceRepository.findSettings();
      expect(mockNotifSettings.findUnique).toHaveBeenCalledWith({
        where: { id: "default" },
      });
    });
  });

  describe("upsertSettings", () => {
    it("upserts settings with quiet hours", async () => {
      mockNotifSettings.upsert.mockResolvedValue({});
      await notificationPreferenceRepository.upsertSettings({
        quietStart: 22,
        quietEnd: 8,
      });
      expect(mockNotifSettings.upsert).toHaveBeenCalledWith({
        where: { id: "default" },
        update: { quietStart: 22, quietEnd: 8 },
        create: { id: "default", quietStart: 22, quietEnd: 8 },
      });
    });

    it("accepts null quiet hours (disabled)", async () => {
      mockNotifSettings.upsert.mockResolvedValue({});
      await notificationPreferenceRepository.upsertSettings({
        quietStart: null,
        quietEnd: null,
      });
      expect(mockNotifSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { quietStart: null, quietEnd: null },
        }),
      );
    });
  });
});
