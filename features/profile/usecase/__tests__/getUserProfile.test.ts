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

describe("getUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user when authenticated", async () => {
    const mockUser = {
      id: "user-1",
      name: "Test",
      email: "test@test.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.api.getSession.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockRepo.findById.mockResolvedValue(mockUser);

    const { default: getUserProfile } = await import("../getUserProfile");
    const result = await getUserProfile({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("user-1");
      expect(result.data.email).toBe("test@test.com");
    }
  });

  it("should fail when not authenticated", async () => {
    mockAuth.api.getSession.mockResolvedValue(null);

    const { default: getUserProfile } = await import("../getUserProfile");
    const result = await getUserProfile({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Utilisateur non authentifié");
    }
  });

  it("should fail when user not found", async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: "user-missing" },
    });
    mockRepo.findById.mockResolvedValue(null);

    const { default: getUserProfile } = await import("../getUserProfile");
    const result = await getUserProfile({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Utilisateur non trouvé");
    }
  });
});
