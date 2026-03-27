import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (key: string) => (key === "host" ? "localhost:3000" : "http"),
  })),
  cookies: vi.fn(async () => ({
    set: (key: string, value: string) => cookieStore.set(key, value),
    get: (key: string) => {
      const val = cookieStore.get(key);
      return val ? { value: val } : undefined;
    },
    delete: (key: string) => cookieStore.delete(key),
  })),
}));

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should send OTP and store email in cookies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, statusText: "OK" }),
    );

    const { default: login } = await import("../login");
    const result = await login({ email: "test@test.com" });

    expect(result.success).toBe(true);
    expect(cookieStore.get("otp_email")).toBe("test@test.com");
  });

  it("should store name in cookies when provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, statusText: "OK" }),
    );

    const { default: login } = await import("../login");
    const result = await login({ email: "test@test.com", name: "John" });

    expect(result.success).toBe(true);
    expect(cookieStore.get("otp_name")).toBe("John");
  });

  it("should fail when fetch returns not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, statusText: "Unauthorized" }),
    );

    const { default: login } = await import("../login");
    const result = await login({ email: "test@test.com" });

    expect(result.success).toBe(false);
  });
});
