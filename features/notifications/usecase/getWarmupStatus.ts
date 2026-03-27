import type { DataType } from "@prisma/client";
import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import { WARMUP_MIN_POINTS } from "@/lib/anomaly-detector";

const SENSOR_TYPES: DataType[] = [
  "TEMPERATURE",
  "HUMIDITY",
  "CO2",
  "PRESSURE",
  "LIGHT",
];

/**
 * Determines whether the system is still in its warmup period.
 *
 * The warmup period ends once every active sensor has accumulated at least
 * `WARMUP_MIN_POINTS` data points in the database. A sensor is considered
 * "active" if it has recorded at least one data point. If no sensor has any
 * data at all, the system is considered to be warming up.
 *
 * @returns `true` if one or more active sensors have not yet reached the warmup threshold.
 */
export async function getWarmupStatus(): Promise<boolean> {
  const counts = await Promise.all(
    SENSOR_TYPES.map((type) =>
      dataPointRepository
        .findLatestByType(type, WARMUP_MIN_POINTS + 1)
        .then((rows) => rows.length),
    ),
  );
  const activeCounts = counts.filter((c) => c > 0);
  if (activeCounts.length === 0) return true;
  return activeCounts.some((c) => c <= WARMUP_MIN_POINTS);
}
