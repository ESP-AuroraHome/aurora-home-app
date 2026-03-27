// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/features/auth/usecase/signOut", () => ({ default: vi.fn() }));

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import signOut from "@/features/auth/usecase/signOut";
import SignOutButton from "../SignOutButton";

const mockPush = vi.fn();
const mockSignOut = vi.mocked(signOut);
const mockToastError = vi.mocked(toast.error);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ push: mockPush } as never);
  vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as never);
});

describe("SignOutButton", () => {
  it("renders with signOut label", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: "signOut" })).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<SignOutButton disabled={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls signOut and redirects on success", async () => {
    mockSignOut.mockResolvedValue({ success: true });
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("shows spinner while signing out", async () => {
    mockSignOut.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100),
        ),
    );
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows error toast when signOut fails", async () => {
    mockSignOut.mockResolvedValue({ success: false, error: "Erreur réseau" });
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Erreur réseau");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
