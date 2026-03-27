// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));

import type { DataType } from "@prisma/client";
import { useTranslations } from "next-intl";
import IAQScore from "../IAQScore";

type SerializedDataPoint = { value: string; createdAt: string };

function makeData(
  overrides: Partial<Record<DataType, SerializedDataPoint[]>> = {},
): Record<DataType, SerializedDataPoint[]> {
  return {
    TEMPERATURE: [],
    HUMIDITY: [],
    PRESSURE: [],
    CO2: [],
    LIGHT: [],
    ...overrides,
  };
}

function dp(value: string): SerializedDataPoint[] {
  return [{ value, createdAt: new Date().toISOString() }];
}

beforeEach(() => {
  vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as never);
});

describe("IAQScore", () => {
  it("returns null when no data is available", () => {
    const { container } = render(<IAQScore data={makeData()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders excellent level for optimal values", () => {
    render(
      <IAQScore
        data={makeData({
          TEMPERATURE: dp("20"),
          HUMIDITY: dp("50"),
          CO2: dp("500"),
        })}
      />,
    );
    expect(screen.getByText("excellent")).toBeInTheDocument();
    expect(screen.getByText("excellentDesc")).toBeInTheDocument();
  });

  it("renders poor level for bad values", () => {
    render(
      <IAQScore
        data={makeData({
          TEMPERATURE: dp("35"),
          HUMIDITY: dp("90"),
          CO2: dp("2000"),
        })}
      />,
    );
    expect(screen.getByText("poor")).toBeInTheDocument();
  });

  it("renders good level for slightly sub-optimal values", () => {
    render(
      <IAQScore
        data={makeData({
          TEMPERATURE: dp("24"),
          HUMIDITY: dp("65"),
          CO2: dp("800"),
        })}
      />,
    );
    expect(screen.getByText("good")).toBeInTheDocument();
  });

  it("renders moderate level for degraded values", () => {
    // temp=24 (+22/33), humidity=65 (+22/34), co2=1200 (+11/33) → 55/100 = 55 → moderate
    render(
      <IAQScore
        data={makeData({
          TEMPERATURE: dp("24"),
          HUMIDITY: dp("65"),
          CO2: dp("1200"),
        })}
      />,
    );
    expect(screen.getByText("moderate")).toBeInTheDocument();
  });

  it("displays the score out of 100", () => {
    render(
      <IAQScore
        data={makeData({
          TEMPERATURE: dp("20"),
          HUMIDITY: dp("50"),
          CO2: dp("500"),
        })}
      />,
    );
    expect(screen.getByText("/100")).toBeInTheDocument();
  });

  it("computes score with partial data (only temperature)", () => {
    const { container } = render(
      <IAQScore data={makeData({ TEMPERATURE: dp("20") })} />,
    );
    expect(container.firstChild).not.toBeNull();
  });
});
