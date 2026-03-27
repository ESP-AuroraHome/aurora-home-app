import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { userRepository } from "../userRepository";

const mockUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe("userRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("findById", () => {
    it("queries user by id", async () => {
      mockUser.findUnique.mockResolvedValue({ id: "user-1" });
      const result = await userRepository.findById("user-1");
      expect(result).toEqual({ id: "user-1" });
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });

    it("returns null when user not found", async () => {
      mockUser.findUnique.mockResolvedValue(null);
      const result = await userRepository.findById("unknown");
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("queries user by email", async () => {
      mockUser.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
      });
      const result = await userRepository.findByEmail("test@test.com");
      expect(result?.email).toBe("test@test.com");
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { email: "test@test.com" },
      });
    });

    it("returns null when email not found", async () => {
      mockUser.findUnique.mockResolvedValue(null);
      const result = await userRepository.findByEmail("nope@test.com");
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("updates user fields by id", async () => {
      const updated = { id: "user-1", name: "Alice" };
      mockUser.update.mockResolvedValue(updated);
      const result = await userRepository.update("user-1", { name: "Alice" });
      expect(result).toEqual(updated);
      expect(mockUser.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "Alice" },
      });
    });

    it("can update multiple fields at once", async () => {
      mockUser.update.mockResolvedValue({});
      await userRepository.update("user-1", {
        name: "Bob",
        email: "bob@test.com",
        onboardingCompleted: true,
      });
      expect(mockUser.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "Bob", email: "bob@test.com", onboardingCompleted: true },
      });
    });
  });
});
