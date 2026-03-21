import type { DataType } from "@prisma/client";
import mqtt from "mqtt";
import { alertRepository } from "@/features/notifications/repository/alertRepository";
import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import { detectAnomaly } from "./anomaly-detector";
import { sensorEmitter } from "./sensor-emitter";

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

function parseNumericValue(raw: string): string {
  const match = raw.match(/^([\d.]+)/);
  return match ? match[1] : raw;
}

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

          // Détection d'anomalie
          const numericValue = parseFloat(valueStr);
          if (!isNaN(numericValue)) {
            const recent = await dataPointRepository.findLatestByType(dataType, 6);
            const recentValues = recent
              .slice(1) // exclure le point qu'on vient de créer
              .map((p) => parseFloat(p.value))
              .filter((v) => !isNaN(v));

            const detection = detectAnomaly(dataType, numericValue, recentValues);
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
                console.log(`🚨 Alerte créée : ${alert.message}`);
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
