import type { DataType, Severity } from "@prisma/client";
import { NextResponse } from "next/server";
import { thresholdRepository } from "@/features/settings/repository/thresholdRepository";

export async function GET() {
  const thresholds = await thresholdRepository.findAll();
  return NextResponse.json(thresholds);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { sensorType, highValue, highSeverity, lowValue, lowSeverity } =
    body as {
      sensorType: DataType;
      highValue: number | null;
      highSeverity: Severity | null;
      lowValue: number | null;
      lowSeverity: Severity | null;
    };

  if (!sensorType) {
    return NextResponse.json({ error: "Missing sensorType" }, { status: 400 });
  }

  const threshold = await thresholdRepository.upsert({
    sensorType,
    highValue,
    highSeverity,
    lowValue,
    lowSeverity,
  });

  return NextResponse.json(threshold);
}
