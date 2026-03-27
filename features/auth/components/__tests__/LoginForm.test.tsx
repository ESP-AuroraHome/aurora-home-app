// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
vi.mock("../../usecase/login", () => ({ default: vi.fn() }));

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import login from "../../usecase/login";
import LoginForm from "../LoginForm";

const mockPush = vi.fn();
const mockLogin = vi.mocked(login);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ push: mockPush } as never);
  vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as never);
});

describe("LoginForm", () => {
  it("renders the email input and submit button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "login" })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty email", async () => {
    render(<LoginForm />);
    // biome-ignore lint/style/noNonNullAssertion: form always rendered in test
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText("emailInvalid")).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email format", async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByRole("textbox"), "notanemail");
    // biome-ignore lint/style/noNonNullAssertion: form always rendered in test
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText("emailInvalid")).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login with email and redirects on success", async () => {
    mockLogin.mockResolvedValue({ success: true });
    render(<LoginForm />);
    await userEvent.type(screen.getByRole("textbox"), "user@example.com");
    // biome-ignore lint/style/noNonNullAssertion: form always rendered in test
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: "user@example.com" });
      expect(mockPush).toHaveBeenCalledWith("/auth/otp?type=sign-in");
    });
  });

  it("does not redirect when login fails", async () => {
    mockLogin.mockResolvedValue({ success: false, error: "Email inconnu" });
    render(<LoginForm />);
    await userEvent.type(screen.getByRole("textbox"), "user@example.com");
    // biome-ignore lint/style/noNonNullAssertion: form always rendered in test
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
