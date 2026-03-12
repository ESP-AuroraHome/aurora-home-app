import mqtt from "mqtt";
import prisma from "./prisma";
import { sensorEmitter } from "./sensor-emitter";
import { DataType } from "@prisma/client";

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
          const value = parseNumericValue(raw[key]);
          const dp = await prisma.dataPoint.create({
            data: { type: dataType, value },
          });
          dataPoints[dataType] = {
            id: dp.id,
            type: dp.type,
            value: dp.value,
            createdAt: dp.createdAt.toISOString(),
          };
        }
      }

      console.log(
        `💾 ${Object.keys(dataPoints).length} DataPoints sauvegardés en base`
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
    console.log("🔄 Tentative de reconnexion MQTT...");
  });

  client.on("error", (err) => {
    console.error("❌ Erreur MQTT:", err.message);
  });

  client.on("offline", () => {
    console.log("⚠️  Client MQTT hors ligne");
  });

  return client;
}
