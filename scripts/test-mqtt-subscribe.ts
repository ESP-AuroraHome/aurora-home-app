/**
 * Script de test pour s'abonner a un topic MQTT et afficher les messages
 *
 * Usage:
 *   tsx scripts/test-mqtt-subscribe.ts <topic>
 *
 * Exemple:
 *   tsx scripts/test-mqtt-subscribe.ts sensor/temperature
 *   tsx scripts/test-mqtt-subscribe.ts sensor/#
 */

import mqtt from "mqtt";

const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL || "mqtt://192.168.4.2:1883";

const topic = process.argv[2];

if (!topic) {
  console.error("❌ Usage: tsx scripts/test-mqtt-subscribe.ts <topic>");
  console.error(
    "   Exemple: tsx scripts/test-mqtt-subscribe.ts sensor/temperature"
  );
  process.exit(1);
}

console.log(`🔌 Connexion au broker MQTT: ${MQTT_BROKER_URL}`);

const client = mqtt.connect(MQTT_BROKER_URL, {
  clientId: `aurora-test-${Date.now()}`,
  reconnectPeriod: 5000,
  connectTimeout: 10000,
});

client.on("connect", () => {
  console.log(`✅ Connecté`);
  console.log(`📡 Abonnement au topic: ${topic}`);
  console.log(`⏳ En attente de messages... (Ctrl+C pour quitter)\n`);

  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Erreur subscribe:`, err.message);
    }
  });
});

client.on("message", (receivedTopic, message) => {
  const timestamp = new Date().toISOString();
  const messageStr = message.toString();

  let parsedMessage: string | object = messageStr;
  try {
    parsedMessage = JSON.parse(messageStr);
  } catch {}

  console.log(`\n📨 [${timestamp}]`);
  console.log(`   Topic: ${receivedTopic}`);
  console.log(`   Message:`, parsedMessage);
});

client.on("error", (err) => {
  console.error("❌ Erreur MQTT:", err.message);
});

process.on("SIGINT", () => {
  console.log("\n\n🔇 Déconnexion...");
  client.unsubscribe(topic);
  client.end();
  process.exit(0);
});

process.stdin.resume();
