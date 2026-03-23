import type { DataType } from "@prisma/client";
import { alertRepository } from "@/features/notifications/repository/alertRepository";
import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import { detectAnomaly, getResolvableAlertTypes } from "@/lib/anomaly-detector";
import { sensorEmitter } from "@/lib/sensor-emitter";

export const dynamic = "force-dynamic";

const SENSOR_KEYS: Record<string, DataType> = {
  temperature: "TEMPERATURE",
  humidity: "HUMIDITY",
  pressure: "PRESSURE",
  co2: "CO2",
  light: "LIGHT",
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not available in production" }, { status: 403 });
  }

  const raw = await request.json() as Record<string, string | number>;
  const dataPoints: Record<string, unknown> = {};

  for (const [key, dataType] of Object.entries(SENSOR_KEYS)) {
    if (raw[key] === undefined) continue;

    const valueStr = String(raw[key]);
    const dp = await dataPointRepository.create({ type: dataType, value: valueStr });

    dataPoints[dataType] = {
      id: dp.id,
      type: dp.type,
      value: dp.value,
      createdAt: dp.createdAt.toISOString(),
    };

    const numericValue = parseFloat(valueStr);
    if (!isNaN(numericValue)) {
      const recent = await dataPointRepository.findLatestByType(dataType, 6);
      const recentValues = recent
        .slice(1)
        .map((p) => parseFloat(p.value))
        .filter((v) => !isNaN(v));

      const detection = detectAnomaly(dataType, numericValue, recentValues);

      const resolvable = getResolvableAlertTypes(dataType, numericValue, recentValues);
      let totalResolved = 0;
      for (const alertType of resolvable) {
        totalResolved += await alertRepository.resolveUnresolvedByType(dataType, alertType);
      }
      if (totalResolved > 0) {
        sensorEmitter.emit("alerts_auto_resolved", {
          type: "alerts_auto_resolved",
          data: { sensorType: dataType },
        });
      }

      if (detection) {
        const alreadyAlerted = await alertRepository.hasRecentUnresolved(
          dataType,
          detection.type,
        );
        if (!alreadyAlerted) {
          const alert = await alertRepository.create(detection);
          sensorEmitter.emit("alert_created", {
            type: "alert_created",
            data: {
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              sensorType: alert.sensorType,
              value: alert.value,
              threshold: alert.threshold,
              message: alert.message,
              suggestions: JSON.parse(alert.suggestions) as string[],
              read: alert.read,
              resolvedAt: null,
              createdAt: alert.createdAt.toISOString(),
            },
          });
        }
      }
    }
  }

  sensorEmitter.emit("sensor_update", { type: "sensor_update", data: dataPoints });

  return Response.json({ ok: true });
}
