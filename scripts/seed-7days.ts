/**
 * Seed 7 jours de données réalistes (dérive naturelle)
 * Un point toutes les 5 minutes par capteur
 *
 * Usage:
 *   npx tsx scripts/seed-7days.ts
 *   npx tsx scripts/seed-7days.ts --days 3
 *   npx tsx scripts/seed-7days.ts --interval 10   # toutes les 10 min
 *   npx tsx scripts/seed-7days.ts --clear          # vide la DB avant
 */

import { DataType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DAYS = parseInt(getArg("--days") ?? "7");
const INTERVAL_MIN = parseInt(getArg("--interval") ?? "5");
const CLEAR = args.includes("--clear");

function getArg(flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function drift(value: number, min: number, max: number, variance: number): number {
  return clamp(value + (Math.random() - 0.5) * variance, min, max);
}

async function main() {
  if (CLEAR) {
    console.log("🗑️  Suppression des données existantes...");
    await prisma.dataPoint.deleteMany({});
  }

  const now = new Date();
  const startDate = new Date(now.getTime() - DAYS * 24 * 60 * 60 * 1000);
  const intervalMs = INTERVAL_MIN * 60 * 1000;
  const totalSteps = Math.floor((now.getTime() - startDate.getTime()) / intervalMs);

  console.log("━".repeat(60));
  console.log("  Aurora Home — Seed 7 jours");
  console.log("━".repeat(60));
  console.log(`  Période    : ${DAYS} jours`);
  console.log(`  Intervalle : ${INTERVAL_MIN} min`);
  console.log(`  Points     : ${totalSteps} par capteur (${totalSteps * 5} total)`);
  console.log(`  Vider DB   : ${CLEAR ? "oui" : "non"}`);
  console.log("━".repeat(60));

  const state = {
    temperature: 21.5,
    humidity: 55.0,
    pressure: 1013.2,
    co2: 450,
    light: 300,
  };

  const records: { createdAt: Date; value: string; type: DataType }[] = [];

  for (let i = 0; i < totalSteps; i++) {
    const timestamp = new Date(startDate.getTime() + i * intervalMs);
    const hour = timestamp.getHours();

    // Cycles jour/nuit réalistes
    const isDaytime = hour >= 7 && hour <= 22;
    state.temperature = drift(state.temperature, isDaytime ? 18 : 15, isDaytime ? 26 : 22, 0.4);
    state.humidity    = drift(state.humidity,    35, 70, 0.8);
    state.pressure    = drift(state.pressure,   995, 1025, 0.3);
    state.co2         = drift(state.co2,         isDaytime ? 400 : 350, isDaytime ? 900 : 550, 15);
    state.light       = clamp(
      isDaytime
        ? drift(state.light, 100, 800, 50)
        : drift(state.light, 0, 30, 5),
      0,
      1000,
    );

    records.push({ createdAt: timestamp, value: state.temperature.toFixed(2), type: DataType.TEMPERATURE });
    records.push({ createdAt: timestamp, value: state.humidity.toFixed(2),    type: DataType.HUMIDITY });
    records.push({ createdAt: timestamp, value: state.pressure.toFixed(2),    type: DataType.PRESSURE });
    records.push({ createdAt: timestamp, value: Math.round(state.co2).toString(), type: DataType.CO2 });
    records.push({ createdAt: timestamp, value: Math.round(state.light).toString(), type: DataType.LIGHT });
  }

  const BATCH = 1000;
  for (let i = 0; i < records.length; i += BATCH) {
    await prisma.dataPoint.createMany({ data: records.slice(i, i + BATCH) });
    const pct = Math.round(((i + BATCH) / records.length) * 100);
    process.stdout.write(`\r  Insertion : ${Math.min(pct, 100)}%`);
  }

  console.log(`\n✅ ${records.length} points insérés`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
