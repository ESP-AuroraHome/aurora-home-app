import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/notifications/repository/alertRepository", () => ({
  alertRepository: {
    findRecent: vi.fn(),
    countUnread: vi.fn(),
  },
}));

import { alertRepository } from "@/features/notifications/repository/alertRepository";
import { getAlerts, getUnreadCount } from "../getAlerts";

const mockRepo = alertRepository as unknown as {
  findRecent: ReturnType<typeof vi.fn>;
  countUnread: ReturnType<typeof vi.fn>;
};

const makeAlert = (overrides = {}) => ({
  id: "alert-1",
  type: "THRESHOLD_HIGH" as const,
  severity: "WARNING" as const,
  sensorType: "TEMPERATURE" as const,
  value: 30,
  threshold: 28,
  message: "Temp high",
  suggestions: JSON.stringify(["Open window"]),
  read: false,
  resolvedAt: null,
  createdAt: new Date("2024-01-01T12:00:00Z"),
  ...overrides,
});

describe("getAlerts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches 50 recent alerts", async () => {
    mockRepo.findRecent.mockResolvedValue([]);
    await getAlerts();
    expect(mockRepo.findRecent).toHaveBeenCalledWith(50);
  });

  it("parses suggestions JSON string into array", async () => {
    mockRepo.findRecent.mockResolvedValue([makeAlert()]);
    const alerts = await getAlerts();
    expect(alerts[0].suggestions).toEqual(["Open window"]);
  });

  it("converts createdAt Date to ISO string", async () => {
    mockRepo.findRecent.mockResolvedValue([makeAlert()]);
    const alerts = await getAlerts();
    expect(alerts[0].createdAt).toBe("2024-01-01T12:00:00.000Z");
  });

  it("converts resolvedAt Date to ISO string when present", async () => {
    const resolvedAt = new Date("2024-01-01T13:00:00Z");
    mockRepo.findRecent.mockResolvedValue([makeAlert({ resolvedAt })]);
    const alerts = await getAlerts();
    expect(alerts[0].resolvedAt).toBe("2024-01-01T13:00:00.000Z");
  });

  it("sets resolvedAt to null when not resolved", async () => {
    mockRepo.findRecent.mockResolvedValue([makeAlert({ resolvedAt: null })]);
    const alerts = await getAlerts();
    expect(alerts[0].resolvedAt).toBeNull();
  });
});

describe("getUnreadCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates to alertRepository.countUnread", async () => {
    mockRepo.countUnread.mockResolvedValue(7);
    const count = await getUnreadCount();
    expect(count).toBe(7);
    expect(mockRepo.countUnread).toHaveBeenCalled();
  });
});
