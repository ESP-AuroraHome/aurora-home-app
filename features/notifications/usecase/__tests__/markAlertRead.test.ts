import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/notifications/repository/alertRepository", () => ({
  alertRepository: {
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    resolveAll: vi.fn(),
  },
}));

import { alertRepository } from "@/features/notifications/repository/alertRepository";
import {
  markAlertRead,
  markAllAlertsRead,
  resolveAllAlerts,
} from "../markAlertRead";

const mockRepo = alertRepository as unknown as {
  markRead: ReturnType<typeof vi.fn>;
  markAllRead: ReturnType<typeof vi.fn>;
  resolveAll: ReturnType<typeof vi.fn>;
};

describe("markAlertRead", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls alertRepository.markRead with the given id", async () => {
    mockRepo.markRead.mockResolvedValue(undefined);
    await markAlertRead("alert-123");
    expect(mockRepo.markRead).toHaveBeenCalledWith("alert-123");
  });
});

describe("markAllAlertsRead", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls alertRepository.markAllRead", async () => {
    mockRepo.markAllRead.mockResolvedValue(undefined);
    await markAllAlertsRead();
    expect(mockRepo.markAllRead).toHaveBeenCalled();
  });
});

describe("resolveAllAlerts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls alertRepository.resolveAll", async () => {
    mockRepo.resolveAll.mockResolvedValue(undefined);
    await resolveAllAlerts();
    expect(mockRepo.resolveAll).toHaveBeenCalled();
  });
});
