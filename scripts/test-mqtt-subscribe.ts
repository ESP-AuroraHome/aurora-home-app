/**
 * Script de test pour s'abonner à un topic MQTT et afficher les messages
 * 
 * Usage:
 *   tsx scripts/test-mqtt-subscribe.ts <topic>
 * 
 * Exemple:
 *   tsx scripts/test-mqtt-subscribe.ts sensor/temperature
 *   tsx scripts/test-mqtt-subscribe.ts sensor/#
 */

import { subscribeToTopic, getMqttClient } from "../lib/mqtt-client";

const topic = process.argv[2];

if (!topic) {
  console.error("❌ Usage: tsx scripts/test-mqtt-subscribe.ts <topic>");
  console.error("   Exemple: tsx scripts/test-mqtt-subscribe.ts sensor/temperature");
  process.exit(1);
}

console.log(`🔌 Connexion au broker MQTT...`);
console.log(`📡 Abonnement au topic: ${topic}`);
console.log(`⏳ En attente de messages... (Ctrl+C pour quitter)\n`);

subscribeToTopic(
  topic,
  (receivedTopic, message) => {
    const timestamp = new Date().toISOString();
    const messageStr = message.toString();
    
    let parsedMessage: string | object = messageStr;
    try {
      parsedMessage = JSON.parse(messageStr);
    } catch {
    }

    console.log(`\n📨 [${timestamp}]`);
    console.log(`   Topic: ${receivedTopic}`);
    console.log(`   Message:`, parsedMessage);
    console.log(`   Raw: ${messageStr}`);
  },
  { qos: 1 }
);

process.on("SIGINT", () => {
  console.log("\n\n🔇 Déconnexion...");
  const client = getMqttClient();
  client.unsubscribe(topic);
  client.end();
  process.exit(0);
});

process.stdin.resume();

