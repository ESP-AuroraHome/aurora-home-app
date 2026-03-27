import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    alert: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { alertRepository } from "../alertRepository";

const mockAlert = prisma.alert as unknown as {
  create: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
};

describe("alertRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("create", () => {
    it("JSON-stringifies suggestions before persisting", async () => {
      const suggestions = ["tip 1", "tip 2"];
      mockAlert.create.mockResolvedValue({ id: "1" });

      await alertRepository.create({
        type: "THRESHOLD_HIGH",
        severity: "WARNING",
        sensorType: "TEMPERATURE",
        value: 30,
        threshold: 28,
        message: "Temp high",
        suggestions,
      });

      expect(mockAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          suggestions: JSON.stringify(suggestions),
        }),
      });
    });

    it("sets threshold to null when not provided", async () => {
      mockAlert.create.mockResolvedValue({ id: "1" });

      await alertRepository.create({
        type: "SUDDEN_CHANGE",
        severity: "WARNING",
        sensorType: "CO2",
        value: 600,
        message: "Sudden change",
        suggestions: [],
      });

      expect(mockAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ threshold: null }),
      });
    });
  });

  describe("findRecent", () => {
    it("queries with default limit of 50 ordered by desc", async () => {
      mockAlert.findMany.mockResolvedValue([]);
      await alertRepository.findRecent();
      expect(mockAlert.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    });

    it("uses custom limit when provided", async () => {
      mockAlert.findMany.mockResolvedValue([]);
      await alertRepository.findRecent(10);
      expect(mockAlert.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    });
  });

  describe("findUnread", () => {
    it("filters by read: false", async () => {
      mockAlert.findMany.mockResolvedValue([]);
      await alertRepository.findUnread();
      expect(mockAlert.findMany).toHaveBeenCalledWith({
        where: { read: false },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("countUnread", () => {
    it("counts alerts with read: false", async () => {
      mockAlert.count.mockResolvedValue(5);
      const count = await alertRepository.countUnread();
      expect(count).toBe(5);
      expect(mockAlert.count).toHaveBeenCalledWith({ where: { read: false } });
    });
  });

  describe("markRead", () => {
    it("sets read: true for given id", async () => {
      mockAlert.update.mockResolvedValue({ id: "abc", read: true });
      await alertRepository.markRead("abc");
      expect(mockAlert.update).toHaveBeenCalledWith({
        where: { id: "abc" },
        data: { read: true },
      });
    });
  });

  describe("markAllRead", () => {
    it("updates all unread alerts to read: true", async () => {
      mockAlert.updateMany.mockResolvedValue({ count: 3 });
      await alertRepository.markAllRead();
      expect(mockAlert.updateMany).toHaveBeenCalledWith({
        where: { read: false },
        data: { read: true },
      });
    });
  });

  describe("resolve", () => {
    it("sets resolvedAt and read: true", async () => {
      mockAlert.update.mockResolvedValue({ id: "abc" });
      await alertRepository.resolve("abc");
      const call = mockAlert.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: "abc" });
      expect(call.data.read).toBe(true);
      expect(call.data.resolvedAt).toBeInstanceOf(Date);
    });
  });

  describe("resolveAll", () => {
    it("resolves all unresolved alerts", async () => {
      mockAlert.updateMany.mockResolvedValue({ count: 2 });
      await alertRepository.resolveAll();
      const call = mockAlert.updateMany.mock.calls[0][0];
      expect(call.where).toEqual({ resolvedAt: null });
      expect(call.data.read).toBe(true);
      expect(call.data.resolvedAt).toBeInstanceOf(Date);
    });
  });

  describe("resolveUnresolvedBySensor", () => {
    it("resolves alerts filtered by sensorType", async () => {
      mockAlert.updateMany.mockResolvedValue({ count: 2 });
      const count =
        await alertRepository.resolveUnresolvedBySensor("TEMPERATURE");
      expect(count).toBe(2);
      expect(mockAlert.updateMany).toHaveBeenCalledWith({
        where: { sensorType: "TEMPERATURE", resolvedAt: null },
        data: expect.objectContaining({ read: true }),
      });
    });
  });

  describe("resolveUnresolvedByType", () => {
    it("resolves alerts filtered by sensorType and type", async () => {
      mockAlert.updateMany.mockResolvedValue({ count: 1 });
      const count = await alertRepository.resolveUnresolvedByType(
        "CO2",
        "THRESHOLD_HIGH",
      );
      expect(count).toBe(1);
      expect(mockAlert.updateMany).toHaveBeenCalledWith({
        where: { sensorType: "CO2", type: "THRESHOLD_HIGH", resolvedAt: null },
        data: expect.objectContaining({ read: true }),
      });
    });
  });

  describe("hasRecentUnresolved", () => {
    it("returns true when recent unresolved alert exists", async () => {
      mockAlert.count.mockResolvedValue(1);
      const result = await alertRepository.hasRecentUnresolved(
        "TEMPERATURE",
        "THRESHOLD_HIGH",
      );
      expect(result).toBe(true);
    });

    it("returns false when no recent unresolved alert", async () => {
      mockAlert.count.mockResolvedValue(0);
      const result = await alertRepository.hasRecentUnresolved(
        "CO2",
        "SUDDEN_CHANGE",
      );
      expect(result).toBe(false);
    });

    it("queries with 30-minute time window", async () => {
      mockAlert.count.mockResolvedValue(0);
      const before = Date.now() - 30 * 60 * 1000;
      await alertRepository.hasRecentUnresolved("HUMIDITY", "THRESHOLD_LOW");
      const call = mockAlert.count.mock.calls[0][0];
      expect(call.where.resolvedAt).toBeNull();
      expect(call.where.createdAt.gte.getTime()).toBeGreaterThanOrEqual(
        before - 1000,
      );
    });
  });
});
