// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange: (v: string) => void;
  }) => (
    <div>
      {children}
      <button type="button" onClick={() => onValueChange("HIGH")}>
        set-HIGH
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
import NotificationPrefsCard from "../NotificationPrefsCard";

const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const defaultSensorPrefs = [] as never[];
const defaultSettings = null;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as never);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NotificationPrefsCard", () => {
  it("renders all sensor toggles", () => {
    render(
      <NotificationPrefsCard
        initialSensorPrefs={defaultSensorPrefs}
        initialSettings={defaultSettings}
      />,
    );
    const switches = screen.getAllByRole("switch");
    expect(switches.length).toBe(6); // 5 sensors + 1 quiet hours toggle
  });

  it("shows save button after toggling a sensor", async () => {
    render(
      <NotificationPrefsCard
        initialSensorPrefs={defaultSensorPrefs}
        initialSettings={defaultSettings}
      />,
    );
    await userEvent.click(screen.getAllByRole("switch")[0]);
    await waitFor(() => {
      expect(screen.getByText("save")).toBeInTheDocument();
    });
  });

  it("saves preferences and shows success toast", async () => {
    render(
      <NotificationPrefsCard
        initialSensorPrefs={defaultSensorPrefs}
        initialSettings={defaultSettings}
      />,
    );
    await userEvent.click(screen.getAllByRole("switch")[0]);
    await waitFor(() => expect(screen.getByText("save")).toBeInTheDocument());
    await userEvent.click(screen.getByText("save"));
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("saveSuccess");
    });
  });

  it("shows error toast when save fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(
      <NotificationPrefsCard
        initialSensorPrefs={defaultSensorPrefs}
        initialSettings={defaultSettings}
      />,
    );
    await userEvent.click(screen.getAllByRole("switch")[0]);
    await waitFor(() => expect(screen.getByText("save")).toBeInTheDocument());
    await userEvent.click(screen.getByText("save"));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("saveError");
    });
  });
});
