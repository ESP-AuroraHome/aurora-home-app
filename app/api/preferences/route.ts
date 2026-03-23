import { NextResponse } from "next/server";
import { notificationPreferenceRepository } from "@/features/settings/repository/notificationPreferenceRepository";

export async function GET() {
  const [sensorPrefs, settings] = await Promise.all([
    notificationPreferenceRepository.findAllSensorPrefs(),
    notificationPreferenceRepository.findSettings(),
  ]);
  return NextResponse.json({ sensorPrefs, settings });
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.type === "sensor") {
    const pref = await notificationPreferenceRepository.upsertSensorPref({
      sensorType: body.sensorType,
      enabled: body.enabled,
      minSeverity: body.minSeverity,
    });
    return NextResponse.json(pref);
  }

  if (body.type === "settings") {
    const s = await notificationPreferenceRepository.upsertSettings({
      quietStart: body.quietStart ?? null,
      quietEnd: body.quietEnd ?? null,
    });
    return NextResponse.json(s);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
