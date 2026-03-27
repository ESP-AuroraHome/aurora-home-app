import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => ({ unref: vi.fn() })),
}));

describe("otp-display (dev mode)", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    delete process.env.DISPLAY_OTP_DEV_MODE;
    delete process.env.DISPLAY_OTP_ENABLED;
  });

  it("displayOTPOnScreen prints mock screen in dev mode", async () => {
    process.env.DISPLAY_OTP_DEV_MODE = "true";
    const { displayOTPOnScreen } = await import("../otp-display");
    displayOTPOnScreen("123456", "user@test.com");
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("123456");
  });

  it("clearScreen prints mock clear in dev mode", async () => {
    process.env.DISPLAY_OTP_DEV_MODE = "true";
    const { clearScreen } = await import("../otp-display");
    clearScreen();
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("SCREEN CLEARED");
  });

  it("does nothing when not dev mode and not enabled", async () => {
    process.env.DISPLAY_OTP_DEV_MODE = "false";
    process.env.DISPLAY_OTP_ENABLED = "false";
    const { displayOTPOnScreen } = await import("../otp-display");
    displayOTPOnScreen("123456", "user@test.com");
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does nothing when not dev mode and not linux", async () => {
    const originalPlatform = process.platform;
    process.env.DISPLAY_OTP_DEV_MODE = "false";
    process.env.DISPLAY_OTP_ENABLED = "true";
    Object.defineProperty(process, "platform", {
      value: "darwin",
      configurable: true,
    });
    try {
      const { displayOTPOnScreen } = await import("../otp-display");
      displayOTPOnScreen("123456", "user@test.com");
      const { spawn } = await import("node:child_process");
      expect(spawn).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    }
  });
});
