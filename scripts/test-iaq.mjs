#!/usr/bin/env node

/**
 * Testeur des niveaux IAQ
 *
 * Usage:
 *   node scripts/test-iaq.mjs --level excellent
 *   node scripts/test-iaq.mjs --level bon
 *   node scripts/test-iaq.mjs --level moyen
 *   node scripts/test-iaq.mjs --level mauvais
 *   node scripts/test-iaq.mjs --level all     # cycle automatique toutes les 5s
 */

const args = process.argv.slice(2);
const BASE_URL = getArg("--url") ?? "http://localhost:3000";
const LEVEL    = getArg("--level") ?? "excellent";

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const PRESETS = {
  excellent: {
    label:       "Excellent  (score ~100)",
    temperature: "20.5",
    humidity:    "50.0",
    pressure:    "1013.2",
    co2:         "480",
    light:       "350",
  },
  bon: {
    label:       "Bon        (score ~65)",
    temperature: "24.0",
    humidity:    "68.0",
    pressure:    "1010.0",
    co2:         "850",
    light:       "200",
  },
  moyen: {
    label:       "Moyen      (score ~45)",
    temperature: "28.5",
    humidity:    "75.0",
    pressure:    "1008.0",
    co2:         "1200",
    light:       "100",
  },
  mauvais: {
    label:       "Mauvais    (score ~15)",
    temperature: "33.0",
    humidity:    "85.0",
    pressure:    "1005.0",
    co2:         "1800",
    light:       "50",
  },
};

async function inject(preset) {
  const { label, ...payload } = preset;
  try {
    const res = await fetch(`${BASE_URL}/api/dev/inject-sensor`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const ok = res.ok ? "✅" : "❌";
    console.log(`${ok} [${new Date().toLocaleTimeString("fr-FR")}] ${label}`);
    console.log(`     T=${payload.temperature}°C  H=${payload.humidity}%  CO₂=${payload.co2}ppm`);
  } catch (err) {
    console.error(`❌ Impossible de joindre ${BASE_URL} — ${err.message}`);
  }
}

console.log("━".repeat(60));
console.log("  Aurora Home — Testeur IAQ");
console.log("━".repeat(60));
console.log(`  Serveur : ${BASE_URL}`);
console.log(`  Mode    : ${LEVEL}`);
console.log("━".repeat(60) + "\n");

if (LEVEL === "all") {
  const levels = ["excellent", "bon", "moyen", "mauvais"];
  let i = 0;
  const run = async () => {
    const key = levels[i % levels.length];
    await inject(PRESETS[key]);
    i++;
  };
  await run();
  setInterval(run, 5000);
} else {
  const preset = PRESETS[LEVEL];
  if (!preset) {
    console.error(`❌ Niveau inconnu: "${LEVEL}". Valeurs: excellent, bon, moyen, mauvais, all`);
    process.exit(1);
  }
  await inject(preset);
  console.log("\nDonnées envoyées. Relance pour envoyer à nouveau.");
}
