import { describe, expect, it } from "vitest";
import {
  calculateChartDomain,
  getTitleForDataType,
  getUnitForDataType,
} from "../../utils/wording";

describe("getTitleForDataType", () => {
  it("should return correct title without translator", () => {
    expect(getTitleForDataType("TEMPERATURE")).toBe("Temperature");
    expect(getTitleForDataType("HUMIDITY")).toBe("Humidity");
    expect(getTitleForDataType("PRESSURE")).toBe("Pressure");
    expect(getTitleForDataType("CO2")).toBe("CO2");
    expect(getTitleForDataType("LIGHT")).toBe("Light");
  });

  it("should use translator when provided", () => {
    const t = (key: string) => `translated_${key}`;
    expect(getTitleForDataType("TEMPERATURE", t)).toBe(
      "translated_temperature",
    );
  });

  it("should throw for unknown type", () => {
    expect(() => getTitleForDataType("UNKNOWN" as never)).toThrow(
      "Unknown DataType",
    );
  });
});

describe("getUnitForDataType", () => {
  it("should return correct units", () => {
    expect(getUnitForDataType("TEMPERATURE")).toBe("°C");
    expect(getUnitForDataType("HUMIDITY")).toBe("%");
    expect(getUnitForDataType("PRESSURE")).toBe("hPa");
    expect(getUnitForDataType("CO2")).toBe("ppm");
    expect(getUnitForDataType("LIGHT")).toBe("lx");
  });
});

describe("calculateChartDomain", () => {
  it("should return default domain for empty values", () => {
    const domain = calculateChartDomain("TEMPERATURE", []);
    expect(domain).toEqual({ min: 0, max: 30 });
  });

  it("should calculate domain with margins", () => {
    const domain = calculateChartDomain("TEMPERATURE", [20, 25]);
    expect(domain.min).toBeLessThan(20);
    expect(domain.max).toBeGreaterThan(25);
  });

  it("should handle single value for TEMPERATURE (min === max branch)", () => {
    const domain = calculateChartDomain("TEMPERATURE", [22]);
    expect(domain.min).toBeLessThan(22);
    expect(domain.max).toBeGreaterThan(22);
  });

  it("should handle PRESSURE single high value (min === max branch)", () => {
    // Value above 1050 so max doesn't get inflated → min === max after switch
    const domain = calculateChartDomain("PRESSURE", [1100]);
    expect(domain.min).toBe(1090);
    expect(domain.max).toBe(1110);
  });

  it("should handle HUMIDITY single value (default min === max branch)", () => {
    const domain = calculateChartDomain("HUMIDITY", [50]);
    expect(domain.min).toBe(49);
    expect(domain.max).toBe(51);
  });

  it("should handle CO2 single value (default min === max branch)", () => {
    const domain = calculateChartDomain("CO2", [600]);
    expect(domain.min).toBe(599);
    expect(domain.max).toBe(601);
  });

  it("should return default domains for empty values for all sensor types", () => {
    expect(calculateChartDomain("HUMIDITY", [])).toEqual({ min: 0, max: 100 });
    expect(calculateChartDomain("PRESSURE", [])).toEqual({
      min: 950,
      max: 1050,
    });
    expect(calculateChartDomain("CO2", [])).toEqual({ min: 300, max: 2000 });
    expect(calculateChartDomain("LIGHT", [])).toEqual({ min: 0, max: 1000 });
  });
});
