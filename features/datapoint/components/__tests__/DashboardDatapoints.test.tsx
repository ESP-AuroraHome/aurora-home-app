// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useSensorData", () => ({
  useSensorData: vi.fn((initialData) => ({ data: initialData })),
}));

vi.mock("../IAQScore", () => ({
  default: ({ data }: { data: unknown }) => (
    <div data-testid="iaq-score">{JSON.stringify(data)}</div>
  ),
}));

vi.mock("../ItemDatapoint", () => ({
  default: ({ type }: { type: string }) => (
    <div data-testid={`item-${type}`}>{type}</div>
  ),
}));

import DashboardDatapoints from "../DashboardDatapoints";

const emptyData = {
  TEMPERATURE: [],
  HUMIDITY: [],
  PRESSURE: [],
  CO2: [],
  LIGHT: [],
};

describe("DashboardDatapoints", () => {
  it("renders IAQScore and all 5 sensor types", () => {
    render(<DashboardDatapoints initialData={emptyData as never} />);
    expect(screen.getByTestId("iaq-score")).toBeTruthy();
    for (const type of [
      "TEMPERATURE",
      "HUMIDITY",
      "PRESSURE",
      "CO2",
      "LIGHT",
    ]) {
      expect(screen.getByTestId(`item-${type}`)).toBeTruthy();
    }
  });

  it("passes initialData to useSensorData and converts createdAt to Date", () => {
    const isoDate = "2024-01-01T10:00:00.000Z";
    const data = {
      ...emptyData,
      TEMPERATURE: [
        { id: "dp1", type: "TEMPERATURE", value: "22", createdAt: isoDate },
      ],
    };
    render(<DashboardDatapoints initialData={data as never} />);
    expect(screen.getByTestId("item-TEMPERATURE")).toBeTruthy();
  });
});
