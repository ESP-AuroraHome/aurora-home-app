// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
vi.mock("../../usecase/signInOtp", () => ({ default: vi.fn() }));

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import signInOtp from "../../usecase/signInOtp";
import OtpForm from "../OtpForm";

const mockPush = vi.fn();
const mockSignInOtp = vi.mocked(signInOtp);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ push: mockPush } as never);
  vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as never);
});

function getOtpInput(container: HTMLElement) {
  return container.querySelector("input[data-input-otp]") as HTMLInputElement;
}

describe("OtpForm", () => {
  it("renders the submit button", () => {
    render(<OtpForm />);
    expect(screen.getByRole("button", { name: "verify" })).toBeInTheDocument();
  });

  it("renders the OTP input", () => {
    const { container } = render(<OtpForm />);
    expect(getOtpInput(container)).toBeInTheDocument();
  });

  it("calls signInOtp and redirects on success", async () => {
    mockSignInOtp.mockResolvedValue({ success: true });
    const { container } = render(<OtpForm />);

    const otpInput = getOtpInput(container);
    fireEvent.change(otpInput, { target: { value: "123456" } });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mockSignInOtp).toHaveBeenCalledWith({ otp: "123456" });
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("does not redirect when signInOtp fails", async () => {
    mockSignInOtp.mockResolvedValue({ success: false, error: "Code invalide" });
    const { container } = render(<OtpForm />);

    const otpInput = getOtpInput(container);
    fireEvent.change(otpInput, { target: { value: "123456" } });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mockSignInOtp).toHaveBeenCalled();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
