import mqtt, { MqttClient, IClientOptions } from "mqtt";
import prisma from "./prisma";
import { sensorEmitter } from "./sensor-emitter";
import { DataType } from "@prisma/client";

const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL || "mqtt://192.168.4.2:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
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

const mqttOptions: IClientOptions = {
  clientId: `aurora-home-app-${Date.now()}`,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 10000,
  ...(MQTT_USERNAME &&
    MQTT_PASSWORD && {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
    }),
};

let mqttClient: MqttClient | null = null;

export function getMqttClient(): MqttClient {
  if (mqttClient && mqttClient.connected) {
    return mqttClient;
  }

  if (process.env.NODE_ENV !== "production") {
    const globalWithMqtt = global as typeof globalThis & {
      mqttClient: MqttClient | null;
    };
    if (globalWithMqtt.mqttClient && globalWithMqtt.mqttClient.connected) {
      mqttClient = globalWithMqtt.mqttClient;
      return mqttClient;
    }
  }

  console.log(
    `🔌 Tentative de connexion au broker MQTT: ${MQTT_BROKER_URL}`
  );
  mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

  mqttClient.on("connect", () => {
    console.log(`✅ Connecté au broker MQTT: ${MQTT_BROKER_URL}`);
    console.log(`   Client ID: ${mqttOptions.clientId}`);
  });

  mqttClient.on("error", (error) => {
    const errorMessage = error.message || String(error);
    const errorCode =
      (error as any).code || (error as any).errno || "UNKNOWN";
    const errorCodeStr = String(errorCode);
    console.error(`❌ Erreur MQTT (${MQTT_BROKER_URL}):`, errorMessage);
    if (
      errorCodeStr === "ECONNREFUSED" ||
      errorCodeStr.includes("ECONNREFUSED")
    ) {
      console.error(`   ⚠️  Impossible de se connecter. Vérifiez que:`);
      console.error(`   - Le broker MQTT est démarré sur l'ESP32`);
      console.error(
        `   - L'adresse IP est correcte: ${MQTT_BROKER_URL}`
      );
      console.error(`   - Le port est correct (généralement 1883)`);
      console.error(
        `   - Vous êtes sur le même réseau WiFi que l'ESP32`
      );
    }
  });

  mqttClient.on("close", () => {
    console.log(`🔌 Connexion MQTT fermée (${MQTT_BROKER_URL})`);
  });

  mqttClient.on("reconnect", () => {
    console.log(`🔄 Reconnexion au broker MQTT (${MQTT_BROKER_URL})...`);
  });

  mqttClient.on("offline", () => {
    console.log(`📴 Client MQTT hors ligne (${MQTT_BROKER_URL})`);
  });

  if (process.env.NODE_ENV !== "production") {
    const globalWithMqtt = global as typeof globalThis & {
      mqttClient: MqttClient | null;
    };
    globalWithMqtt.mqttClient = mqttClient;
  }

  return mqttClient;
}

export function disconnectMqttClient(): void {
  if (mqttClient) {
    mqttClient.end();
    mqttClient = null;

    if (process.env.NODE_ENV !== "production") {
      const globalWithMqtt = global as typeof globalThis & {
        mqttClient: MqttClient | null;
      };
      globalWithMqtt.mqttClient = null;
    }
  }
}

export async function publishMessage(
  topic: string,
  message: string | object,
  options?: { qos?: 0 | 1 | 2; retain?: boolean }
): Promise<void> {
  const client = getMqttClient();
  const payload =
    typeof message === "string" ? message : JSON.stringify(message);

  return new Promise((resolve, reject) => {
    client.publish(topic, payload, options || {}, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export function subscribeToTopic(
  topic: string | string[],
  callback: (topic: string, message: Buffer) => void,
  options?: { qos?: 0 | 1 | 2 }
): void {
  const client = getMqttClient();

  const subscribeOptions =
    options?.qos !== undefined ? { qos: options.qos } : undefined;

  client.subscribe(topic, subscribeOptions, (error) => {
    if (error) {
      console.error(
        `❌ Erreur lors de l'abonnement au topic ${topic}:`,
        error
      );
    } else {
      console.log(
        `📡 Abonné au topic: ${Array.isArray(topic) ? topic.join(", ") : topic}`
      );
    }
  });

  client.on("message", (receivedTopic, message) => {
    const topics = Array.isArray(topic) ? topic : [topic];
    const matches = topics.some((t) => {
      const pattern = t.replace(/\+/g, "[^/]+").replace(/#/g, ".*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(receivedTopic);
    });

    if (matches) {
      callback(receivedTopic, message);
    }
  });
}

export function unsubscribeFromTopic(topic: string | string[]): void {
  const client = getMqttClient();
  client.unsubscribe(topic, (error) => {
    if (error) {
      console.error(
        `❌ Erreur lors du désabonnement du topic ${topic}:`,
        error
      );
    } else {
      console.log(
        `🔇 Désabonné du topic: ${Array.isArray(topic) ? topic.join(", ") : topic}`
      );
    }
  });
}

export function startMqttClient() {
  const client = getMqttClient();

  subscribeToTopic(MQTT_TOPIC, async (_topic, message) => {
    try {
      const raw = JSON.parse(message.toString());
      const timestamp = new Date();

      console.log(
        `📨 [${timestamp.toISOString()}] Message MQTT reçu:`,
        raw
      );

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

  return client;
}

export default getMqttClient;
