import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = {
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => mockCookieStore),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/features/profile/repository/userRepository", () => ({
  userRepository: {
    update: vi.fn(),
  },
}));

import { redirect } from "next/navigation";
import { userRepository } from "@/features/profile/repository/userRepository";
import { auth } from "@/lib/auth";
import completeOnboarding from "../completeOnboarding";

const mockAuth = auth as unknown as {
  api: { getSession: ReturnType<typeof vi.fn> };
};
const mockUserRepository = userRepository as unknown as {
  update: ReturnType<typeof vi.fn>;
};
const mockRedirect = redirect as ReturnType<typeof vi.fn>;

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when user is not authenticated", async () => {
    mockAuth.api.getSession.mockResolvedValue(null);

    await expect(
      completeOnboarding({ name: "Alice", locale: "fr" }),
    ).rejects.toThrow("Utilisateur non authentifié");
  });

  it("updates user profile and sets locale cookie on success", async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockUserRepository.update.mockResolvedValue({});

    await completeOnboarding({ name: "Alice", locale: "fr" });

    expect(mockUserRepository.update).toHaveBeenCalledWith("user-1", {
      name: "Alice",
      image: null,
      onboardingCompleted: true,
    });

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "locale",
      "fr",
      expect.objectContaining({ path: "/" }),
    );
  });

  it("redirects to / after completion", async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockUserRepository.update.mockResolvedValue({});

    await completeOnboarding({ name: "Alice", locale: "en" }).catch(() => {});

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});
