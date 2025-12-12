/**
 * Initialisation automatique de l'écouteur MQTT
 * Ce fichier s'exécute automatiquement lors de l'import
 */

import { initializeMqttListener } from "./mqtt-listener";

if (typeof window === "undefined") {
  initializeMqttListener();
}

