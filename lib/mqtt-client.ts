import mqtt, { MqttClient, IClientOptions } from "mqtt";

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://192.168.4.2:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || `aurora-home-app-${Date.now()}`;

const mqttOptions: IClientOptions = {
  clientId: MQTT_CLIENT_ID,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 10 * 1000,
  ...(MQTT_USERNAME && MQTT_PASSWORD && {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
  }),
};

let mqttClient: MqttClient | null = null;

/**
 * Obtient ou crée une instance singleton du client MQTT
 * @returns Instance du client MQTT
 */
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

  console.log(`🔌 Tentative de connexion au broker MQTT: ${MQTT_BROKER_URL}`);
  mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

  mqttClient.on("connect", () => {
    console.log(`✅ Connecté au broker MQTT: ${MQTT_BROKER_URL}`);
    console.log(`   Client ID: ${mqttOptions.clientId}`);
  });

  mqttClient.on("error", (error) => {
    const errorMessage = error.message || String(error);
    const errorCode = (error as any).code || (error as any).errno || "UNKNOWN";
    const errorCodeStr = String(errorCode);
    console.error(`❌ Erreur MQTT (${MQTT_BROKER_URL}):`, errorMessage);
    if (errorCodeStr === "ECONNREFUSED" || errorCodeStr.includes("ECONNREFUSED")) {
      console.error(`   ⚠️  Impossible de se connecter. Vérifiez que:`);
      console.error(`   - Le broker MQTT est démarré sur l'ESP32`);
      console.error(`   - L'adresse IP est correcte: ${MQTT_BROKER_URL}`);
      console.error(`   - Le port est correct (généralement 1883)`);
      console.error(`   - Vous êtes sur le même réseau WiFi que l'ESP32`);
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

/**
 * Déconnecte le client MQTT
 */
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

/**
 * Publie un message sur un topic MQTT
 * @param topic - Le topic sur lequel publier
 * @param message - Le message à publier (sera converti en string si ce n'est pas déjà le cas)
 * @param options - Options de publication (qos, retain, etc.)
 */
export async function publishMessage(
  topic: string,
  message: string | object,
  options?: { qos?: 0 | 1 | 2; retain?: boolean }
): Promise<void> {
  const client = getMqttClient();
  const payload = typeof message === "string" ? message : JSON.stringify(message);
  
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

/**
 * S'abonne à un topic MQTT
 * @param topic - Le topic auquel s'abonner (peut être un pattern avec # ou +)
 * @param callback - Fonction appelée lorsqu'un message est reçu
 * @param options - Options d'abonnement (qos, etc.)
 */
export function subscribeToTopic(
  topic: string | string[],
  callback: (topic: string, message: Buffer) => void,
  options?: { qos?: 0 | 1 | 2 }
): void {
  const client = getMqttClient();
  
  const subscribeOptions = options?.qos !== undefined ? { qos: options.qos } : undefined;
  
  client.subscribe(topic, subscribeOptions, (error) => {
    if (error) {
      console.error(`❌ Erreur lors de l'abonnement au topic ${topic}:`, error);
    } else {
      console.log(`📡 Abonné au topic: ${Array.isArray(topic) ? topic.join(", ") : topic}`);
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

/**
 * Se désabonne d'un topic MQTT
 * @param topic - Le topic duquel se désabonner
 */
export function unsubscribeFromTopic(topic: string | string[]): void {
  const client = getMqttClient();
  client.unsubscribe(topic, (error) => {
    if (error) {
      console.error(`❌ Erreur lors du désabonnement du topic ${topic}:`, error);
    } else {
      console.log(`🔇 Désabonné du topic: ${Array.isArray(topic) ? topic.join(", ") : topic}`);
    }
  });
}

export default getMqttClient;

