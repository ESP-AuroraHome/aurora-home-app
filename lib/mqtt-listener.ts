/**
 * Écouteur MQTT - Lit automatiquement les messages du broker
 * 
 * Configuration via variables d'environnement:
 *   MQTT_TOPICS - Liste des topics séparés par des virgules (ex: "sensor/data" ou "sensor/#")
 */

import { subscribeToTopic, getMqttClient } from "./mqtt-client";

const MQTT_TOPICS = process.env.MQTT_TOPICS?.split(",").map((t) => t.trim()) || [];

let isInitialized = false;

/**
 * Initialise l'écoute des messages MQTT
 * Cette fonction doit être appelée au démarrage du serveur
 */
export function initializeMqttListener() {
  if (isInitialized) {
    console.log("⚠️  L'écouteur MQTT est déjà initialisé");
    return;
  }

  if (MQTT_TOPICS.length === 0) {
    console.log("ℹ️  Aucun topic MQTT configuré (MQTT_TOPICS)");
    console.log("   Pour écouter des messages, ajoutez MQTT_TOPICS dans votre .env");
    return;
  }

  console.log(`\n📡 ===== Initialisation de l'écouteur MQTT =====`);
  console.log(`   Topics à écouter: ${MQTT_TOPICS.join(", ")}`);

  const client = getMqttClient();

  client.once("connect", () => {
    console.log(`📡 Connexion établie, abonnement aux topics...`);
    MQTT_TOPICS.forEach((topic) => {
      subscribeToTopic(
        topic,
        (receivedTopic, message) => {
          handleMqttMessage(receivedTopic, message);
        },
        { qos: 1 }
      );
    });
    console.log(`✅ Écouteur MQTT prêt à recevoir des messages\n`);
  });

  if (client.connected) {
    console.log(`📡 Déjà connecté, abonnement aux topics...`);
    MQTT_TOPICS.forEach((topic) => {
      subscribeToTopic(
        topic,
        (receivedTopic, message) => {
          handleMqttMessage(receivedTopic, message);
        },
        { qos: 1 }
      );
    });
    console.log(`✅ Écouteur MQTT prêt à recevoir des messages\n`);
  }

  isInitialized = true;
}

/**
 * Traite les messages MQTT reçus
 * Vous pouvez modifier cette fonction pour sauvegarder dans la base de données, etc.
 */
function handleMqttMessage(topic: string, message: Buffer) {
  const timestamp = new Date().toISOString();
  const messageStr = message.toString();

  let parsedMessage: string | object = messageStr;
  try {
    parsedMessage = JSON.parse(messageStr);
  } catch {
  }

  console.log(`\n📨 [${timestamp}] Message MQTT reçu:`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Données:`, parsedMessage);

  // - Sauvegarder dans la base de données (Prisma)
  // - Traiter les données selon le type
  // - Déclencher des actions
  // - etc.
  
  // Exemple: Sauvegarder dans la base de données
  // await saveMqttMessageToDatabase(topic, parsedMessage);
}

