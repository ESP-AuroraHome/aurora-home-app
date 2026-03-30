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

vi.mock("@/lib/otp-display", () => ({
  clearScreen: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInEmailOTP: vi.fn(),
    },
  },
}));

vi.mock("@/features/profile/repository/userRepository", () => ({
  userRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => {
      const val = cookieStore.get(key);
      return val ? { value: val } : undefined;
    },
    set: (key: string, value: string) => cookieStore.set(key, value),
    delete: (key: string) => cookieStore.delete(key),
  })),
}));

import { userRepository } from "@/features/profile/repository/userRepository";
import { auth } from "@/lib/auth";

const mockAuth = auth as unknown as {
  api: { signInEmailOTP: ReturnType<typeof vi.fn> };
};
const mockUserRepo = userRepository as unknown as {
  findById: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe("signInOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.clear();
  });

  it("returns error when otp_email cookie is missing", async () => {
    const { default: signInOtp } = await import("../signInOtp");
    const result = await signInOtp({ otp: "123456" });
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toContain(
      "OTP email not found",
    );
  });

  it("returns error when auth.api.signInEmailOTP returns no user", async () => {
    cookieStore.set("otp_email", "test@test.com");
    mockAuth.api.signInEmailOTP.mockResolvedValue({ user: null });

    const { default: signInOtp } = await import("../signInOtp");
    const result = await signInOtp({ otp: "123456" });
    expect(result.success).toBe(false);
  });

  it("updates image when user has no image", async () => {
    cookieStore.set("otp_email", "test@test.com");
    mockAuth.api.signInEmailOTP.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockUserRepo.findById.mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test",
      image: null,
    });
    mockUserRepo.update.mockResolvedValue({});

    const { default: signInOtp } = await import("../signInOtp");
    await signInOtp({ otp: "123456" });

    expect(mockUserRepo.update).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ image: expect.any(String) }),
    );
  });

  it("updates name when user has no name", async () => {
    cookieStore.set("otp_email", "john.doe@test.com");
    mockAuth.api.signInEmailOTP.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockUserRepo.findById.mockResolvedValue({
      id: "user-1",
      email: "john.doe@test.com",
      name: null,
      image: "existing-image",
    });
    mockUserRepo.update.mockResolvedValue({});

    const { default: signInOtp } = await import("../signInOtp");
    await signInOtp({ otp: "123456" });

    expect(mockUserRepo.update).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ name: "John" }),
    );
  });

  it("uses provided name from cookie over extracted name", async () => {
    cookieStore.set("otp_email", "john.doe@test.com");
    cookieStore.set("otp_name", "Johnny");
    mockAuth.api.signInEmailOTP.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockUserRepo.findById.mockResolvedValue({
      id: "user-1",
      email: "john.doe@test.com",
      name: null,
      image: "existing-image",
    });
    mockUserRepo.update.mockResolvedValue({});

    const { default: signInOtp } = await import("../signInOtp");
    await signInOtp({ otp: "123456" });

    expect(mockUserRepo.update).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ name: "Johnny" }),
    );
  });

  it("does nothing when user is not found in DB after OTP", async () => {
    cookieStore.set("otp_email", "ghost@test.com");
    mockAuth.api.signInEmailOTP.mockResolvedValue({
      user: { id: "user-ghost" },
    });
    mockUserRepo.findById.mockResolvedValue(null);

    const { default: signInOtp } = await import("../signInOtp");
    const result = await signInOtp({ otp: "123456" });

    expect(result.success).toBe(true);
    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it("does not update when user already has name and image", async () => {
    cookieStore.set("otp_email", "test@test.com");
    mockAuth.api.signInEmailOTP.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockUserRepo.findById.mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Alice",
      image: "existing-image",
    });

    const { default: signInOtp } = await import("../signInOtp");
    await signInOtp({ otp: "123456" });

    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });
});
