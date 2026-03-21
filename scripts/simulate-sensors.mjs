#!/usr/bin/env node

/**
 * Simulateur de capteurs Aurora Home
 *
 * Usage:
 *   node scripts/simulate-sensors.mjs                  # Mode normal
 *   node scripts/simulate-sensors.mjs --anomaly co2    # Pic de CO₂
 *   node scripts/simulate-sensors.mjs --anomaly temp   # Pic de température
 *   node scripts/simulate-sensors.mjs --anomaly hum    # Humidité élevée
 *   node scripts/simulate-sensors.mjs --interval 2000  # Toutes les 2s (défaut: 3s)
 *   node scripts/simulate-sensors.mjs --url http://localhost:3003
 */

const args = process.argv.slice(2);

const BASE_URL = getArg("--url") ?? "http://localhost:3000";
const INTERVAL_MS = parseInt(getArg("--interval") ?? "3000");
const ANOMALY_TYPE = getArg("--anomaly"); // "co2" | "temp" | "hum" | null

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

// ── État initial des capteurs ────────────────────────────────────────────────

const state = {
  temperature: 21.5,
  humidity: 55.0,
  pressure: 1013.2,
  co2: 450,
  light: 300,
};

let step = 0;

// ── Utilitaires ───────────────────────────────────────────────────────────────

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function drift(value, min, max, variance) {
  return clamp(value + (Math.random() - 0.5) * variance, min, max);
}

// ── Simulation d'anomalies ───────────────────────────────────────────────────

function applyAnomaly() {
  switch (ANOMALY_TYPE) {
    case "co2":
      // Montée progressive du CO₂ → dépasse 800 (WARNING) puis 1500 (HIGH)
      if (step <= 20) {
        state.co2 = clamp(state.co2 + 80 + Math.random() * 30, 300, 2500);
      }
      break;

    case "temp":
      // Montée de température → dépasse 28°C (WARNING) puis 32°C (HIGH)
      if (step <= 15) {
        state.temperature = clamp(state.temperature + 1.2 + Math.random() * 0.5, 10, 45);
      }
      break;

    case "hum":
      // Humidité montante → dépasse 70% (WARNING) puis 80% (HIGH)
      if (step <= 20) {
        state.humidity = clamp(state.humidity + 2 + Math.random(), 20, 95);
      }
      break;

    case "sudden":
      // Variation brutale soudaine à l'étape 8
      if (step === 8) {
        state.co2 = state.co2 * 1.8;
        state.temperature = state.temperature * 1.4;
      }
      break;
  }
}

// ── Envoi des données ─────────────────────────────────────────────────────────

async function sendData() {
  step++;

  // Dérive naturelle
  state.temperature = drift(state.temperature, 15, 30, 0.3);
  state.humidity    = drift(state.humidity,    30, 70, 0.5);
  state.pressure    = drift(state.pressure,   995, 1025, 0.2);
  state.co2         = drift(state.co2,         350, 700, 8);
  state.light       = drift(state.light,        50, 800, 25);

  // Appliquer l'anomalie par-dessus
  if (ANOMALY_TYPE) applyAnomaly();

  const payload = {
    temperature: state.temperature.toFixed(1),
    humidity:    state.humidity.toFixed(1),
    pressure:    state.pressure.toFixed(1),
    co2:         Math.round(state.co2).toString(),
    light:       Math.round(state.light).toString(),
  };

  try {
    const res = await fetch(`${BASE_URL}/api/dev/inject-sensor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const time = new Date().toLocaleTimeString("fr-FR");
      console.log(
        `[${time}] step=${String(step).padStart(3)} | ` +
        `T=${payload.temperature.padStart(5)}°C  ` +
        `H=${payload.humidity.padStart(5)}%  ` +
        `P=${payload.pressure.padStart(7)}hPa  ` +
        `CO₂=${String(payload.co2).padStart(4)}ppm  ` +
        `L=${String(payload.light).padStart(4)}lx`,
      );
    } else {
      const text = await res.text();
      console.error(`[ERREUR] ${res.status} ${res.statusText}: ${text}`);
    }
  } catch (err) {
    console.error(
      `[ERREUR] Impossible de joindre ${BASE_URL} — le serveur est-il démarré ?`,
      `\n         ${err.message}`,
    );
  }
}

// ── Démarrage ─────────────────────────────────────────────────────────────────

const modeLabel = ANOMALY_TYPE
  ? `anomalie "${ANOMALY_TYPE}"`
  : "normal (dérive naturelle)";

console.log("━".repeat(70));
console.log("  Aurora Home — Simulateur de capteurs");
console.log("━".repeat(70));
console.log(`  Mode     : ${modeLabel}`);
console.log(`  Serveur  : ${BASE_URL}`);
console.log(`  Intervalle: ${INTERVAL_MS}ms`);
console.log("━".repeat(70));
console.log("  Ctrl+C pour arrêter\n");

await sendData();
setInterval(sendData, INTERVAL_MS);
