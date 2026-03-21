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
      signOut: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

import { auth } from "@/lib/auth";

const mockAuth = auth as unknown as {
  api: { signOut: ReturnType<typeof vi.fn> };
};

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sign out successfully", async () => {
    mockAuth.api.signOut.mockResolvedValue(undefined);

    const { default: signOut } = await import("../signOut");
    const result = await signOut({});

    expect(result.success).toBe(true);
    expect(mockAuth.api.signOut).toHaveBeenCalled();
  });

  it("should return error when sign out fails", async () => {
    mockAuth.api.signOut.mockRejectedValue(new Error("Sign out failed"));

    const { default: signOut } = await import("../signOut");
    const result = await signOut({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Sign out failed");
    }
  });
});
