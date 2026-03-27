/**
 * Insère 125 DataPoints réalistes par capteur pour passer le seuil de chauffe (120 pts).
 * Le banner disparaît et les alertes s'activent.
 *
 * Usage : npm run test-warmup-fill
 */
import { type DataType, PrismaClient } from "@prisma/client";

const WARMUP_MIN_POINTS = 120;
const POINTS_TO_INSERT = WARMUP_MIN_POINTS + 5;

const prisma = new PrismaClient();

const SENSOR_RANGES: Record<DataType, { min: number; max: number }> = {
  TEMPERATURE: { min: 19, max: 22 },
  HUMIDITY: { min: 40, max: 55 },
  CO2: { min: 400, max: 600 },
  PRESSURE: { min: 1010, max: 1020 },
  LIGHT: { min: 50, max: 300 },
};

async function main() {
  const now = Date.now();
  // Intervalle de 5s entre chaque point (fréquence réelle du capteur)
  const intervalMs = 5_000;

  const rows = [];
  for (const [type, range] of Object.entries(SENSOR_RANGES) as [
    DataType,
    { min: number; max: number },
  ][]) {
    for (let i = 0; i < POINTS_TO_INSERT; i++) {
      const value = (
        range.min +
        Math.random() * (range.max - range.min)
      ).toFixed(2);
      rows.push({
        type,
        value,
        createdAt: new Date(now - (POINTS_TO_INSERT - i) * intervalMs),
      });
    }
  }

  await prisma.dataPoint.createMany({ data: rows });

  console.log(
    `✅ ${rows.length} DataPoints insérés (${POINTS_TO_INSERT} par capteur)`,
  );
  console.log(
    "   Rechargez le dashboard — le banner de chauffe doit avoir disparu.",
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
