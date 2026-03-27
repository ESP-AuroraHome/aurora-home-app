import type { DataType } from "@prisma/client";

export type TrendDirection = "up" | "down" | "stable";

const STABILITY_THRESHOLDS: Record<DataType, number> = {
  TEMPERATURE: 0.5,
  HUMIDITY: 1,
  PRESSURE: 0.5,
  CO2: 20,
  LIGHT: 30,
};

export function useTrend(type: DataType, values: number[]): TrendDirection {
  if (values.length < 2) return "stable";

  const latest = values[0];
  const previous = values.slice(1, 4);
  const avg = previous.reduce((sum, v) => sum + v, 0) / previous.length;
  const delta = latest - avg;
  const threshold = STABILITY_THRESHOLDS[type];

  if (delta > threshold) return "up";
  if (delta < -threshold) return "down";
  return "stable";
}
