// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange: (v: string) => void;
    value: string;
  }) => (
    <div data-testid="select" data-value={value}>
      {children}
      <button type="button" onClick={() => onValueChange("WARNING")}>
        set-WARNING
      </button>
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder: string }) => (
    <span>{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-value={value}>{children}</div>,
}));

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import ThresholdsCard from "../ThresholdsCard";

const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as never);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ThresholdsCard", () => {
  it("renders all sensor threshold sections", () => {
    render(<ThresholdsCard initialThresholds={[]} />);
    expect(screen.getByText("sensor.TEMPERATURE")).toBeInTheDocument();
    expect(screen.getByText("sensor.HUMIDITY")).toBeInTheDocument();
    expect(screen.getByText("sensor.CO2")).toBeInTheDocument();
    expect(screen.getByText("sensor.PRESSURE")).toBeInTheDocument();
  });

  it("does not render save button when no changes", () => {
    render(<ThresholdsCard initialThresholds={[]} />);
    expect(screen.queryByText("save")).not.toBeInTheDocument();
  });

  it("shows save button after incrementing a value", async () => {
    render(<ThresholdsCard initialThresholds={[]} />);
    const incrementButtons = screen.getAllByRole("button", { name: "" });
    await userEvent.click(incrementButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("save")).toBeInTheDocument();
    });
  });

  it("resets a sensor threshold on reset click", async () => {
    render(<ThresholdsCard initialThresholds={[]} />);
    const incrementButtons = screen.getAllByRole("button", { name: "" });
    await userEvent.click(incrementButtons[0]);
    await waitFor(() => expect(screen.getByText("save")).toBeInTheDocument());
    await userEvent.click(screen.getAllByText("reset")[0]);
    await waitFor(() => {
      expect(screen.queryByText("save")).not.toBeInTheDocument();
    });
  });

  it("saves thresholds and shows success toast", async () => {
    render(<ThresholdsCard initialThresholds={[]} />);
    const incrementButtons = screen.getAllByRole("button", { name: "" });
    await userEvent.click(incrementButtons[0]);
    await waitFor(() => expect(screen.getByText("save")).toBeInTheDocument());
    await userEvent.click(screen.getByText("save"));
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("saveSuccessThresholds");
    });
  });

  it("shows error toast when save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );
    render(<ThresholdsCard initialThresholds={[]} />);
    const incrementButtons = screen.getAllByRole("button", { name: "" });
    await userEvent.click(incrementButtons[0]);
    await waitFor(() => expect(screen.getByText("save")).toBeInTheDocument());
    await userEvent.click(screen.getByText("save"));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("saveErrorThresholds");
    });
  });
});
