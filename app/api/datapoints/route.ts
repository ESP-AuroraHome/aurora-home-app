import type { DataType } from "@prisma/client";
import { NextResponse } from "next/server";
import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";

const PERIODS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7j": 7 * 24 * 60 * 60 * 1000,
};

const VALID_TYPES: DataType[] = [
  "TEMPERATURE",
  "HUMIDITY",
  "PRESSURE",
  "CO2",
  "LIGHT",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as DataType | null;
  const period = searchParams.get("period") ?? "1h";

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const ms = PERIODS[period];
  if (!ms) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const since = new Date(Date.now() - ms);
  const datapoints = await dataPointRepository.findByTypeSince(type, since);

  return NextResponse.json(
    datapoints.map((dp) => ({
      id: dp.id,
      type: dp.type,
      value: dp.value,
      createdAt: dp.createdAt.toISOString(),
    })),
  );
}
