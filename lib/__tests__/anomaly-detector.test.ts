import { describe, expect, it } from "vitest";
import {
  detectAnomaly,
  getResolvableAlertTypes,
  WARMUP_MIN_POINTS,
} from "../anomaly-detector";

describe("WARMUP_MIN_POINTS", () => {
  it("should be 120", () => {
    expect(WARMUP_MIN_POINTS).toBe(120);
  });
});

describe("detectAnomaly", () => {
  describe("TEMPERATURE - high threshold (default)", () => {
    it("returns null for normal temperature", () => {
      expect(detectAnomaly("TEMPERATURE", 20, [])).toBeNull();
    });

    it("returns THRESHOLD_HIGH WARNING at exactly first threshold (28°C)", () => {
      const result = detectAnomaly("TEMPERATURE", 28, []);
      expect(result).not.toBeNull();
      expect(result?.type).toBe("THRESHOLD_HIGH");
      expect(result?.severity).toBe("WARNING");
      expect(result?.threshold).toBe(28);
      expect(result?.sensorType).toBe("TEMPERATURE");
      expect(result?.value).toBe(28);
    });

    it("returns THRESHOLD_HIGH for temperature above first threshold", () => {
      const result = detectAnomaly("TEMPERATURE", 35, []);
      expect(result?.type).toBe("THRESHOLD_HIGH");
      expect(result?.severity).toBe("WARNING");
    });

    it("includes non-empty suggestions for TEMPERATURE THRESHOLD_HIGH", () => {
      const result = detectAnomaly("TEMPERATURE", 30, []);
      expect(result?.suggestions.length).toBeGreaterThan(0);
    });

    it("includes a human-readable message", () => {
      const result = detectAnomaly("TEMPERATURE", 30, []);
      expect(result?.message).toContain("Température");
      expect(result?.message).toContain("30.0°C");
    });
  });

  describe("TEMPERATURE - low threshold (default)", () => {
    it("returns THRESHOLD_LOW WARNING at first low threshold (14°C)", () => {
      const result = detectAnomaly("TEMPERATURE", 14, []);
      expect(result?.type).toBe("THRESHOLD_LOW");
      expect(result?.severity).toBe("WARNING");
      expect(result?.threshold).toBe(14);
    });

    it("returns THRESHOLD_LOW for temperature below first low threshold", () => {
      const result = detectAnomaly("TEMPERATURE", 5, []);
      expect(result?.type).toBe("THRESHOLD_LOW");
    });

    it("returns null for temperature between thresholds", () => {
      expect(detectAnomaly("TEMPERATURE", 20, [])).toBeNull();
    });
  });

  describe("HUMIDITY", () => {
    it("returns THRESHOLD_HIGH at 70%", () => {
      const result = detectAnomaly("HUMIDITY", 70, []);
      expect(result?.type).toBe("THRESHOLD_HIGH");
      expect(result?.severity).toBe("WARNING");
    });

    it("returns THRESHOLD_LOW at 25%", () => {
      const result = detectAnomaly("HUMIDITY", 25, []);
      expect(result?.type).toBe("THRESHOLD_LOW");
      expect(result?.severity).toBe("WARNING");
    });

    it("returns null for normal humidity (50%)", () => {
      expect(detectAnomaly("HUMIDITY", 50, [])).toBeNull();
    });
  });

  describe("CO2", () => {
    it("returns THRESHOLD_HIGH at 800 ppm", () => {
      const result = detectAnomaly("CO2", 800, []);
      expect(result?.type).toBe("THRESHOLD_HIGH");
      expect(result?.severity).toBe("WARNING");
      expect(result?.message).toContain("CO₂");
    });

    it("returns null for normal CO2 (400 ppm)", () => {
      expect(detectAnomaly("CO2", 400, [])).toBeNull();
    });

    it("has no low threshold - returns null for very low CO2", () => {
      expect(detectAnomaly("CO2", 0, [])).toBeNull();
    });
  });

  describe("PRESSURE", () => {
    it("returns THRESHOLD_LOW at 970 hPa", () => {
      const result = detectAnomaly("PRESSURE", 970, []);
      expect(result?.type).toBe("THRESHOLD_LOW");
      expect(result?.severity).toBe("WARNING");
    });

    it("returns null for normal pressure (1013 hPa)", () => {
      expect(detectAnomaly("PRESSURE", 1013, [])).toBeNull();
    });

    it("has no high threshold - returns null for very high pressure", () => {
      expect(detectAnomaly("PRESSURE", 1100, [])).toBeNull();
    });
  });

  describe("LIGHT", () => {
    it("returns null for any light level (no thresholds)", () => {
      expect(detectAnomaly("LIGHT", 0, [])).toBeNull();
      expect(detectAnomaly("LIGHT", 10000, [])).toBeNull();
    });
  });

  describe("override", () => {
    it("uses override highValue instead of default", () => {
      const result = detectAnomaly("TEMPERATURE", 31, [], {
        highValue: 30,
        highSeverity: "CRITICAL",
      });
      expect(result?.type).toBe("THRESHOLD_HIGH");
      expect(result?.severity).toBe("CRITICAL");
      expect(result?.threshold).toBe(30);
    });

    it("uses override lowValue instead of default", () => {
      const result = detectAnomaly("TEMPERATURE", 19, [], {
        lowValue: 20,
        lowSeverity: "HIGH",
      });
      expect(result?.type).toBe("THRESHOLD_LOW");
      expect(result?.severity).toBe("HIGH");
      expect(result?.threshold).toBe(20);
    });

    it("does not trigger override high threshold when value is below", () => {
      const result = detectAnomaly("TEMPERATURE", 25, [], {
        highValue: 30,
        highSeverity: "CRITICAL",
      });
      expect(result).toBeNull();
    });
  });

  describe("SUDDEN_CHANGE", () => {
    it("returns null with fewer than 3 recent values", () => {
      expect(detectAnomaly("TEMPERATURE", 20, [10, 10])).toBeNull();
    });

    it("returns SUDDEN_CHANGE WARNING for 25% deviation from average", () => {
      const recentValues = [20, 20, 20];
      const result = detectAnomaly("TEMPERATURE", 25, recentValues);
      expect(result?.type).toBe("SUDDEN_CHANGE");
      expect(result?.severity).toBe("WARNING");
    });

    it("returns SUDDEN_CHANGE HIGH for >= 50% deviation from average", () => {
      // Use values in normal range (14–28) to avoid threshold detection
      const recentValues = [14, 14, 14];
      const result = detectAnomaly("TEMPERATURE", 22, recentValues);
      expect(result?.type).toBe("SUDDEN_CHANGE");
      expect(result?.severity).toBe("HIGH");
    });

    it("returns null for deviation below 25%", () => {
      const recentValues = [20, 20, 20];
      const result = detectAnomaly("TEMPERATURE", 24, recentValues);
      expect(result).toBeNull();
    });

    it("includes percentage in message", () => {
      const recentValues = [20, 20, 20];
      const result = detectAnomaly("TEMPERATURE", 25, recentValues);
      expect(result?.message).toContain("variation");
    });

    it("returns null when avg is 0 to avoid division by zero", () => {
      // Use LIGHT sensor (no thresholds) so only sudden change is checked
      const recentValues = [0, 0, 0];
      const result = detectAnomaly("LIGHT", 10, recentValues);
      expect(result).toBeNull();
    });

    it("threshold takes priority over sudden change when both would trigger", () => {
      // value=30 breaches TEMPERATURE 28°C threshold AND has >25% deviation from avg=20
      const recentValues = [20, 20, 20];
      const result = detectAnomaly("TEMPERATURE", 30, recentValues);
      expect(result?.type).toBe("THRESHOLD_HIGH");
    });

    it("LIGHT sensor can trigger SUDDEN_CHANGE", () => {
      const recentValues = [100, 100, 100];
      const result = detectAnomaly("LIGHT", 200, recentValues);
      expect(result?.type).toBe("SUDDEN_CHANGE");
    });

    it("stores percentage in threshold field", () => {
      const recentValues = [20, 20, 20];
      const result = detectAnomaly("TEMPERATURE", 25, recentValues);
      expect(result?.threshold).toBe(25);
    });
  });
});

describe("getResolvableAlertTypes", () => {
  it("returns all three types for normal temperature (no thresholds breached)", () => {
    const resolvable = getResolvableAlertTypes("TEMPERATURE", 20, []);
    expect(resolvable).toContain("THRESHOLD_HIGH");
    expect(resolvable).toContain("THRESHOLD_LOW");
    expect(resolvable).toContain("SUDDEN_CHANGE");
  });

  it("does not include THRESHOLD_HIGH when value is above high threshold", () => {
    const resolvable = getResolvableAlertTypes("TEMPERATURE", 30, []);
    expect(resolvable).not.toContain("THRESHOLD_HIGH");
    expect(resolvable).toContain("THRESHOLD_LOW");
    expect(resolvable).toContain("SUDDEN_CHANGE");
  });

  it("does not include THRESHOLD_LOW when value is below low threshold", () => {
    const resolvable = getResolvableAlertTypes("TEMPERATURE", 10, []);
    expect(resolvable).toContain("THRESHOLD_HIGH");
    expect(resolvable).not.toContain("THRESHOLD_LOW");
    expect(resolvable).toContain("SUDDEN_CHANGE");
  });

  it("always includes SUDDEN_CHANGE", () => {
    const resolvable = getResolvableAlertTypes("TEMPERATURE", 40, []);
    expect(resolvable).toContain("SUDDEN_CHANGE");
  });

  it("includes THRESHOLD_HIGH for CO2 when value is normal (no high threshold exceeded)", () => {
    const resolvable = getResolvableAlertTypes("CO2", 400, []);
    expect(resolvable).toContain("THRESHOLD_HIGH");
  });

  it("includes THRESHOLD_LOW for CO2 (no low threshold defined)", () => {
    const resolvable = getResolvableAlertTypes("CO2", 400, []);
    expect(resolvable).toContain("THRESHOLD_LOW");
  });

  it("respects override highValue", () => {
    const resolvable = getResolvableAlertTypes("TEMPERATURE", 25, [], {
      highValue: 20,
    });
    expect(resolvable).not.toContain("THRESHOLD_HIGH");
  });
});
