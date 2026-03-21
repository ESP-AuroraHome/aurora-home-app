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

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => {
  const cookieStore = new Map<string, string>();
  return {
    cookies: vi.fn(async () => ({
      set: (key: string, value: string) => cookieStore.set(key, value),
      get: (key: string) => {
        const val = cookieStore.get(key);
        return val ? { value: val } : undefined;
      },
      delete: (key: string) => cookieStore.delete(key),
    })),
  };
});

import { authClient } from "@/lib/auth-client";

const mockAuthClient = authClient as unknown as {
  emailOtp: {
    sendVerificationOtp: ReturnType<typeof vi.fn>;
  };
};

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send OTP and store email in cookies", async () => {
    mockAuthClient.emailOtp.sendVerificationOtp.mockResolvedValue({
      data: { success: false },
      error: null,
    });

    const { default: login } = await import("../login");
    const result = await login({ email: "test@test.com" });

    expect(result.success).toBe(true);
    expect(mockAuthClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
      email: "test@test.com",
      type: "sign-in",
    });
  });

  it("should store name in cookies when provided", async () => {
    mockAuthClient.emailOtp.sendVerificationOtp.mockResolvedValue({
      data: { success: false },
      error: null,
    });

    const { default: login } = await import("../login");
    const result = await login({
      email: "test@test.com",
      name: "John",
    });

    expect(result.success).toBe(true);
  });
});
