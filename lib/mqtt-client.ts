import type { DataType, Severity } from "@prisma/client";
import mqtt from "mqtt";
import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import { alertRepository } from "@/features/notifications/repository/alertRepository";
import { notificationPreferenceRepository } from "@/features/settings/repository/notificationPreferenceRepository";
import { thresholdRepository } from "@/features/settings/repository/thresholdRepository";
import {
  detectAnomaly,
  getResolvableAlertTypes,
  type ThresholdOverride,
  WARMUP_MIN_POINTS,
} from "./anomaly-detector";
import { sensorEmitter } from "./sensor-emitter";

let thresholdCache: Record<string, ThresholdOverride> = {};
let thresholdCacheAt = 0;

/**
 * Returns the per-sensor threshold overrides, refreshed from the database at most once every 60 seconds.
 *
 * @returns A map of sensor type to {@link ThresholdOverride}.
 */
async function getThresholds(): Promise<Record<string, ThresholdOverride>> {
  if (Date.now() - thresholdCacheAt < 60_000) return thresholdCache;
  const rows = await thresholdRepository.findAll();
  thresholdCache = Object.fromEntries(
    rows.map((r) => [
      r.sensorType,
      {
        highValue: r.highValue,
        highSeverity: r.highSeverity,
        lowValue: r.lowValue,
        lowSeverity: r.lowSeverity,
      },
    ]),
  );
  thresholdCacheAt = Date.now();
  return thresholdCache;
}

type PrefsCache = {
  sensors: Record<string, { enabled: boolean; minSeverity: Severity }>;
  quietStart: number | null;
  quietEnd: number | null;
};
let prefsCache: PrefsCache = { sensors: {}, quietStart: null, quietEnd: null };
let prefsCacheAt = 0;

/**
 * Returns the user notification preferences (per-sensor toggles, severity filter, quiet hours),
 * refreshed from the database at most once every 60 seconds.
 *
 * @returns The cached {@link PrefsCache}.
 */
async function getPrefs(): Promise<PrefsCache> {
  if (Date.now() - prefsCacheAt < 60_000) return prefsCache;
  const [sensorPrefs, settings] = await Promise.all([
    notificationPreferenceRepository.findAllSensorPrefs(),
    notificationPreferenceRepository.findSettings(),
  ]);
  prefsCache = {
    sensors: Object.fromEntries(
      sensorPrefs.map((p) => [
        p.sensorType,
        { enabled: p.enabled, minSeverity: p.minSeverity },
      ]),
    ),
    quietStart: settings?.quietStart ?? null,
    quietEnd: settings?.quietEnd ?? null,
  };
  prefsCacheAt = Date.now();
  return prefsCache;
}

const SEVERITY_LEVEL: Record<Severity, number> = {
  WARNING: 0,
  HIGH: 1,
  CRITICAL: 2,
};

/**
 * Returns `true` if the current hour falls within the user-defined quiet hours window.
 * Supports overnight ranges (e.g. 23h → 7h).
 *
 * @param quietStart - Start hour (0–23), or `null` if not configured.
 * @param quietEnd - End hour (0–23), or `null` if not configured.
 */
function isInQuietHours(
  quietStart: number | null,
  quietEnd: number | null,
): boolean {
  if (quietStart === null || quietEnd === null) return false;
  const hour = new Date().getHours();
  if (quietStart <= quietEnd) return hour >= quietStart && hour < quietEnd;
  return hour >= quietStart || hour < quietEnd;
}

let warmupCompleteEmitted = false;

const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL || "mqtt://192.168.4.2:1883";
const MQTT_TOPIC = "sensor/data";

const SENSOR_KEYS: Record<string, DataType> = {
  temperature: "TEMPERATURE",
  humidity: "HUMIDITY",
  pressure: "PRESSURE",
  co2: "CO2",
  light: "LIGHT",
};

/**
 * Strips any trailing unit suffix from a raw sensor value string and returns the numeric part.
 *
 * @param raw - Raw value string from the MQTT payload (e.g. `"23.5°C"` or `"23.5"`).
 * @returns The numeric string (e.g. `"23.5"`).
 */
function parseNumericValue(raw: string): string {
  const match = raw.match(/^([\d.]+)/);
  return match ? match[1] : raw;
}

/**
 * Connects to the MQTT broker, subscribes to the sensor topic, and starts the
 * real-time data ingestion pipeline.
 *
 * For each incoming message the pipeline:
 * 1. Persists every sensor reading as a `DataPoint` in the database.
 * 2. Auto-resolves stale alerts whose sensor value has returned to normal.
 * 3. Skips anomaly detection during the warmup period (`WARMUP_MIN_POINTS` readings per sensor).
 * 4. Emits a one-time `warmup_complete` SSE event when the warmup threshold is crossed.
 * 5. Runs anomaly detection and creates a new `Alert` when an anomaly is confirmed,
 *    respecting per-sensor preferences, severity filters, and quiet hours.
 * 6. Broadcasts `sensor_update` and `alert_created` SSE events to connected clients.
 *
 * @returns The underlying MQTT client instance.
 */
export function startMqttClient() {
  const clientId = `aurora-home-app-${Date.now()}`;

  console.log(`🔗 Connexion MQTT vers ${MQTT_BROKER_URL}...`);
  console.log(`   Client ID: ${clientId}`);

  const client = mqtt.connect(MQTT_BROKER_URL, {
    clientId,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  client.on("connect", () => {
    console.log(`✅ Connecté au broker MQTT: ${MQTT_BROKER_URL}`);
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error(`❌ Erreur subscribe ${MQTT_TOPIC}:`, err.message);
      } else {
        console.log(`📡 Abonné au topic: ${MQTT_TOPIC}`);
      }
    });
  });

  client.on("message", async (_topic, payload) => {
    try {
      const raw = JSON.parse(payload.toString());
      const timestamp = new Date();

      console.log(`📨 [${timestamp.toISOString()}] Message MQTT reçu:`, raw);

      const dataPoints: Record<
        string,
        { id: string; type: DataType; value: string; createdAt: string }
      > = {};

      for (const [key, dataType] of Object.entries(SENSOR_KEYS)) {
        if (raw[key] !== undefined) {
          const valueStr = parseNumericValue(raw[key]);
          const dp = await dataPointRepository.create({
            type: dataType,
            value: valueStr,
          });
          dataPoints[dataType] = {
            id: dp.id,
            type: dp.type,
            value: dp.value,
            createdAt: dp.createdAt.toISOString(),
          };

          const numericValue = parseFloat(valueStr);
          if (!Number.isNaN(numericValue)) {
            const recent = await dataPointRepository.findLatestByType(
              dataType,
              WARMUP_MIN_POINTS + 1,
            );
            const recentValues = recent
              .slice(1)
              .map((p) => parseFloat(p.value))
              .filter((v) => !Number.isNaN(v));

            const [thresholds, prefs] = await Promise.all([
              getThresholds(),
              getPrefs(),
            ]);

            const resolvable = getResolvableAlertTypes(
              dataType,
              numericValue,
              recentValues,
              thresholds[dataType],
            );
            let totalResolved = 0;
            for (const alertType of resolvable) {
              totalResolved += await alertRepository.resolveUnresolvedByType(
                dataType,
                alertType,
              );
            }
            if (totalResolved > 0) {
              console.log(
                `✅ ${totalResolved} alerte(s) auto-résolue(s) pour ${dataType}`,
              );
              sensorEmitter.emit("alerts_auto_resolved", {
                type: "alerts_auto_resolved",
                data: { sensorType: dataType },
              });
            }

            const totalPoints = recent.length;
            if (totalPoints <= WARMUP_MIN_POINTS) {
              console.log(
                `⏳ Chauffe ${dataType} : ${totalPoints}/${WARMUP_MIN_POINTS} points collectés — alertes désactivées`,
              );
            } else {
              if (!warmupCompleteEmitted) {
                warmupCompleteEmitted = true;
                console.log(`🎓 Chauffe terminée — alertes activées`);
                sensorEmitter.emit("warmup_complete", {
                  type: "warmup_complete",
                  data: {},
                });
              }

              const detection = detectAnomaly(
                dataType,
                numericValue,
                recentValues,
                thresholds[dataType],
              );

              if (detection) {
                const sensorPref = prefs.sensors[dataType];
                const isEnabled = sensorPref?.enabled ?? true;
                const minSeverity = sensorPref?.minSeverity ?? "WARNING";
                const severityOk =
                  SEVERITY_LEVEL[detection.severity] >=
                  SEVERITY_LEVEL[minSeverity];
                const quietOk = !isInQuietHours(
                  prefs.quietStart,
                  prefs.quietEnd,
                );

                const alreadyAlerted =
                  await alertRepository.hasRecentUnresolved(
                    dataType,
                    detection.type,
                  );
                if (!alreadyAlerted && isEnabled && severityOk && quietOk) {
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
                  console.log(`🚨 Alerte créée : ${alert.message}`);
                }
              }
            }
          }
        }
      }

      console.log(
        `💾 ${Object.keys(dataPoints).length} DataPoints sauvegardés en base`,
      );

      sensorEmitter.emit("sensor_update", {
        type: "sensor_update",
        data: dataPoints,
      });
    } catch (err) {
      console.error("❌ Erreur traitement message MQTT:", err);
    }
  });

  client.on("reconnect", () => {
    if (process.env.NODE_ENV !== "development") {
      console.log("🔄 Tentative de reconnexion MQTT...");
    }
  });

  client.on("error", (err) => {
    if (process.env.NODE_ENV !== "development") {
      console.error("❌ Erreur MQTT:", err.message);
    }
  });

  client.on("offline", () => {
    if (process.env.NODE_ENV !== "development") {
      console.log("⚠️  Client MQTT hors ligne");
    }
  });

  return client;
}
