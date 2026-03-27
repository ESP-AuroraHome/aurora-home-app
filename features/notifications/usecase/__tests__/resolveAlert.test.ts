import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/notifications/repository/alertRepository", () => ({
  alertRepository: {
    resolve: vi.fn(),
  },
}));

import { alertRepository } from "@/features/notifications/repository/alertRepository";
import { resolveAlert } from "../resolveAlert";

const mockRepo = alertRepository as unknown as {
  resolve: ReturnType<typeof vi.fn>;
};

describe("resolveAlert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls alertRepository.resolve with the given id", async () => {
    mockRepo.resolve.mockResolvedValue(undefined);
    await resolveAlert("alert-456");
    expect(mockRepo.resolve).toHaveBeenCalledWith("alert-456");
  });
});
