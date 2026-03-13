import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/usecase", () => ({
  default:
    <TArgs, TResult>(fn: (args: TArgs) => Promise<TResult> | TResult) =>
    async (args: TArgs) => {
      try {
        const data = await fn(args);
        return { success: true, data };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock("@/features/profile/repository/userRepository", () => ({
  userRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    update: vi.fn(),
  },
}));

import { userRepository } from "@/features/profile/repository/userRepository";
import { auth } from "@/lib/auth";

const mockAuth = auth as unknown as {
  api: { getSession: ReturnType<typeof vi.fn> };
};
const mockRepo = userRepository as unknown as {
  findById: ReturnType<typeof vi.fn>;
  findByEmail: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe("updateUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update profile when authenticated", async () => {
    const updatedUser = {
      id: "user-1",
      name: "Updated Name",
      email: "updated@test.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.api.getSession.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.update.mockResolvedValue(updatedUser);

    const { default: updateUserProfile } = await import("../updateUserProfile");
    const result = await updateUserProfile({
      name: "Updated Name",
      email: "updated@test.com",
      image: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Updated Name");
    }
  });

  it("should fail when not authenticated", async () => {
    mockAuth.api.getSession.mockResolvedValue(null);

    const { default: updateUserProfile } = await import("../updateUserProfile");
    const result = await updateUserProfile({
      name: "Test",
      email: "test@test.com",
      image: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Utilisateur non authentifié");
    }
  });

  it("should fail when email already used by another user", async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockRepo.findByEmail.mockResolvedValue({
      id: "user-2",
      email: "taken@test.com",
    });

    const { default: updateUserProfile } = await import("../updateUserProfile");
    const result = await updateUserProfile({
      name: "Test",
      email: "taken@test.com",
      image: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Cet email est déjà utilisé");
    }
  });
});
