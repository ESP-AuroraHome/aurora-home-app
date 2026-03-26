import { WARMUP_MIN_POINTS } from "@/lib/anomaly-detector";
import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import type { DataType } from "@prisma/client";

const SENSOR_TYPES: DataType[] = ["TEMPERATURE", "HUMIDITY", "CO2", "PRESSURE", "LIGHT"];

export async function getWarmupStatus(): Promise<boolean> {
  const counts = await Promise.all(
    SENSOR_TYPES.map((type) =>
      dataPointRepository
        .findLatestByType(type, WARMUP_MIN_POINTS + 1)
        .then((rows) => rows.length),
    ),
  );
  // En chauffe si au moins un capteur actif n'a pas encore assez de données
  const activeCounts = counts.filter((c) => c > 0);
  if (activeCounts.length === 0) return true; // aucune donnée du tout
  return activeCounts.some((c) => c <= WARMUP_MIN_POINTS);
}
