// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

vi.mock("@/hooks/useAnimatedValue", () => ({
  useAnimatedValue: (v: number) => v,
}));

vi.mock("@/hooks/useTrend", () => ({
  useTrend: vi.fn(() => "stable"),
}));

vi.mock("../ChartDatapoint", () => ({
  default: () => <div data-testid="chart" />,
}));

vi.mock("../IconDataType", () => ({
  default: ({ type }: { type: string }) => (
    <span data-testid={`icon-${type}`} />
  ),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DrawerDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

vi.mock("@/components/ui/item", () => ({
  Item: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) => (
    <div {...props}>{children}</div>
  ),
  ItemHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import ItemDataPoint from "../ItemDatapoint";

function makeDatapoint(value: string, date = new Date()) {
  return {
    id: `dp-${value}`,
    type: "TEMPERATURE" as const,
    value,
    createdAt: date,
    sensorId: "s1",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ json: () => Promise.resolve([]) })),
  );
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ItemDatapoint", () => {
  it("shows 'No data available' when datapoints is empty", () => {
    render(<ItemDataPoint type="TEMPERATURE" datapoints={[]} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders last value when data provided", () => {
    const datapoints = [makeDatapoint("22.50")];
    render(
      <ItemDataPoint type="TEMPERATURE" datapoints={datapoints as never} />,
    );
    expect(screen.getAllByText("22.50").length).toBeGreaterThan(0);
  });

  it("renders period selector buttons", () => {
    const datapoints = [makeDatapoint("22.50")];
    render(
      <ItemDataPoint type="TEMPERATURE" datapoints={datapoints as never} />,
    );
    for (const label of ["Live", "1h", "6h", "24h", "7j"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("renders export button", () => {
    const datapoints = [makeDatapoint("22.50")];
    render(
      <ItemDataPoint type="TEMPERATURE" datapoints={datapoints as never} />,
    );
    expect(screen.getByRole("button", { name: /export/i })).toBeTruthy();
  });

  it("does not fetch when switching to 'live' period", async () => {
    const datapoints = [makeDatapoint("22.50")];
    render(
      <ItemDataPoint type="TEMPERATURE" datapoints={datapoints as never} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Live" }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches historical data when switching to a non-live period", async () => {
    const datapoints = [makeDatapoint("22.50")];
    render(
      <ItemDataPoint type="TEMPERATURE" datapoints={datapoints as never} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "1h" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/datapoints?type=TEMPERATURE&period=1h",
    );
  });

  it("creates a CSV blob when export is clicked", async () => {
    const datapoints = [makeDatapoint("22.50")];
    render(
      <ItemDataPoint type="TEMPERATURE" datapoints={datapoints as never} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /export/i }));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});
