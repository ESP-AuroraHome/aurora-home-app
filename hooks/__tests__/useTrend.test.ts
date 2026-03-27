import { describe, expect, it } from "vitest";
import { useTrend } from "../useTrend";

describe("useTrend", () => {
  it("returns stable when fewer than 2 values", () => {
    expect(useTrend("TEMPERATURE", [])).toBe("stable");
    expect(useTrend("TEMPERATURE", [20])).toBe("stable");
  });

  it("returns up when latest exceeds average by more than threshold", () => {
    // avg of [20, 20, 20] = 20, latest = 21, delta = 1 > 0.5
    expect(useTrend("TEMPERATURE", [21, 20, 20, 20])).toBe("up");
  });

  it("returns down when latest is below average by more than threshold", () => {
    // avg of [20, 20, 20] = 20, latest = 19, delta = -1 < -0.5
    expect(useTrend("TEMPERATURE", [19, 20, 20, 20])).toBe("down");
  });

  it("returns stable when delta is within threshold", () => {
    // avg = 20, latest = 20.3, delta = 0.3 < 0.5
    expect(useTrend("TEMPERATURE", [20.3, 20, 20, 20])).toBe("stable");
  });

  it("uses correct threshold per sensor type (CO2 threshold = 20)", () => {
    expect(useTrend("CO2", [815, 800, 800, 800])).toBe("stable"); // delta=15 < 20
    expect(useTrend("CO2", [825, 800, 800, 800])).toBe("up"); // delta=25 > 20
    expect(useTrend("CO2", [775, 800, 800, 800])).toBe("down"); // delta=-25 < -20
  });

  it("uses only last 3 previous values for average (not all)", () => {
    // previous = slice(1, 4) = [100, 100, 100], avg = 100, latest = 101, delta=1 > 0.5
    expect(useTrend("TEMPERATURE", [101, 100, 100, 100, 50, 50])).toBe("up");
  });

  it("handles HUMIDITY threshold of 1", () => {
    expect(useTrend("HUMIDITY", [51.5, 50, 50, 50])).toBe("up"); // delta=1.5 > 1
    expect(useTrend("HUMIDITY", [50.5, 50, 50, 50])).toBe("stable"); // delta=0.5 < 1
  });

  it("handles LIGHT threshold of 30", () => {
    expect(useTrend("LIGHT", [135, 100, 100, 100])).toBe("up"); // delta=35 > 30
    expect(useTrend("LIGHT", [120, 100, 100, 100])).toBe("stable"); // delta=20 < 30
  });
});
