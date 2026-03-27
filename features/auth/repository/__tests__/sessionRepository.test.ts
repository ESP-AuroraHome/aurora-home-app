import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionRepository } from "../sessionRepository";

vi.mock("@/lib/prisma", () => ({
  default: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

const mockFindUnique = vi.mocked(prisma.session.findUnique);

describe("sessionRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findByToken", () => {
    it("returns the session when found", async () => {
      const session = { id: "s1", token: "abc123", userId: "u1" };
      mockFindUnique.mockResolvedValue(session as never);

      const result = await sessionRepository.findByToken("abc123");

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { token: "abc123" },
      });
      expect(result).toEqual(session);
    });

    it("returns null when session not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await sessionRepository.findByToken("unknown");

      expect(result).toBeNull();
    });
  });
});
