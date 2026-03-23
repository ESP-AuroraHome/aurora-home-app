import type { AlertType, DataType, Severity } from "@prisma/client";

// ── Thresholds ────────────────────────────────────────────────────────────────

type ThresholdLevel = { value: number; severity: Severity };
type SensorThresholds = {
  high?: ThresholdLevel[];   // ascending: WARNING → HIGH → CRITICAL
  low?: ThresholdLevel[];    // descending: WARNING → HIGH → CRITICAL
};

const THRESHOLDS: Record<DataType, SensorThresholds> = {
  TEMPERATURE: {
    high: [
      { value: 28, severity: "WARNING" },
      { value: 32, severity: "HIGH" },
      { value: 38, severity: "CRITICAL" },
    ],
    low: [
      { value: 14, severity: "WARNING" },
      { value: 10, severity: "HIGH" },
      { value: 5,  severity: "CRITICAL" },
    ],
  },
  HUMIDITY: {
    high: [
      { value: 70, severity: "WARNING" },
      { value: 80, severity: "HIGH" },
      { value: 90, severity: "CRITICAL" },
    ],
    low: [
      { value: 25, severity: "WARNING" },
      { value: 18, severity: "HIGH" },
      { value: 10, severity: "CRITICAL" },
    ],
  },
  CO2: {
    high: [
      { value: 800,  severity: "WARNING" },
      { value: 1500, severity: "HIGH" },
      { value: 2000, severity: "CRITICAL" },
    ],
  },
  PRESSURE: {
    low: [
      { value: 970, severity: "WARNING" },
      { value: 960, severity: "HIGH" },
    ],
  },
  LIGHT: {},
};

// Variation brutale : seuil de déviation relatif depuis la moyenne glissante
const SUDDEN_CHANGE_THRESHOLD = 0.25; // 25%

// ── Suggestions ───────────────────────────────────────────────────────────────

const SUGGESTIONS: Record<DataType, Record<AlertType, string[]>> = {
  TEMPERATURE: {
    THRESHOLD_HIGH: [
      "Fermez les volets pour bloquer le rayonnement solaire",
      "Activez la climatisation ou un ventilateur",
      "Ouvrez les fenêtres aux heures fraîches (matin/soir)",
      "Vérifiez si une source de chaleur involontaire est active",
    ],
    THRESHOLD_LOW: [
      "Activez le chauffage ou augmentez sa consigne",
      "Vérifiez si une fenêtre est restée ouverte",
      "Contrôlez l'isolation (joints de portes et fenêtres)",
      "Vérifiez que le thermostat fonctionne correctement",
    ],
    SUDDEN_CHANGE: [
      "Vérifiez si une fenêtre ou porte vient d'être ouverte",
      "Contrôlez qu'aucun appareil chauffant n'est allumé involontairement",
      "Vérifiez que le capteur ESP32 est bien positionné (pas en plein soleil)",
    ],
  },
  HUMIDITY: {
    THRESHOLD_HIGH: [
      "Activez le déshumidificateur",
      "Améliorez la ventilation de la pièce",
      "Vérifiez les fuites d'eau (plomberie, toiture, condensation)",
      "Évitez de faire sécher du linge à l'intérieur",
    ],
    THRESHOLD_LOW: [
      "Utilisez un humidificateur d'air",
      "Vérifiez si le chauffage est trop intense",
      "Placez des plantes d'intérieur pour augmenter l'hygrométrie",
    ],
    SUDDEN_CHANGE: [
      "Vérifiez si un appareil produisant de la vapeur est allumé",
      "Contrôlez l'absence de fuite d'eau à proximité du capteur",
      "Vérifiez que le capteur ESP32 n'est pas exposé à de la condensation",
    ],
  },
  CO2: {
    THRESHOLD_HIGH: [
      "Ouvrez une fenêtre immédiatement pour aérer la pièce",
      "Activez la VMC ou la ventilation mécanique",
      "Réduisez le nombre de personnes dans la pièce si possible",
      "Vérifiez si des appareils à combustion sont en fonctionnement",
      "Évitez les activités physiques intenses dans la pièce",
    ],
    THRESHOLD_LOW: [],
    SUDDEN_CHANGE: [
      "Vérifiez si plusieurs personnes sont entrées simultanément",
      "Contrôlez qu'aucun appareil à combustion n'a été allumé",
      "Vérifiez l'état du capteur CO₂ SCD30 (calibration)",
    ],
  },
  PRESSURE: {
    THRESHOLD_HIGH: [],
    THRESHOLD_LOW: [
      "Une dépression atmosphérique approche, risque de mauvais temps",
      "Fermez les fenêtres en prévision de précipitations ou vent fort",
      "Vérifiez que le capteur BME280 n'est pas exposé à des courants d'air",
    ],
    SUDDEN_CHANGE: [
      "Changement météo rapide détecté",
      "Vérifiez les prévisions météo pour votre région",
      "Assurez-vous que les fenêtres et volets sont sécurisés",
    ],
  },
  LIGHT: {
    THRESHOLD_HIGH: [],
    THRESHOLD_LOW: [],
    SUDDEN_CHANGE: [
      "Vérifiez si une lumière forte a été allumée/éteinte à proximité du capteur",
      "Contrôlez que le capteur BH1750 n'est pas obstrué",
    ],
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AlertDetection {
  type: AlertType;
  severity: Severity;
  sensorType: DataType;
  value: number;
  threshold?: number;
  message: string;
  suggestions: string[];
}

export interface ThresholdOverride {
  highValue?:    number | null;
  highSeverity?: Severity | null;
  lowValue?:     number | null;
  lowSeverity?:  Severity | null;
}

// ── Labels capteurs ───────────────────────────────────────────────────────────

const SENSOR_LABELS: Record<DataType, string> = {
  TEMPERATURE: "Température",
  HUMIDITY:    "Humidité",
  PRESSURE:    "Pression atmosphérique",
  CO2:         "CO₂",
  LIGHT:       "Luminosité",
};

const SENSOR_UNITS: Record<DataType, string> = {
  TEMPERATURE: "°C",
  HUMIDITY:    "%",
  PRESSURE:    "hPa",
  CO2:         "ppm",
  LIGHT:       "lx",
};

// ── Messages ──────────────────────────────────────────────────────────────────

function buildMessage(
  type: AlertType,
  sensorType: DataType,
  value: number,
  threshold?: number,
  avg?: number,
): string {
  const label = SENSOR_LABELS[sensorType];
  const unit  = SENSOR_UNITS[sensorType];
  const v     = value.toFixed(1);

  if (type === "THRESHOLD_HIGH") {
    return `${label} élevée : ${v}${unit} (seuil : ${threshold}${unit})`;
  }
  if (type === "THRESHOLD_LOW") {
    return `${label} basse : ${v}${unit} (seuil : ${threshold}${unit})`;
  }
  if (type === "SUDDEN_CHANGE" && avg !== undefined) {
    const pct = Math.round(Math.abs((value - avg) / avg) * 100);
    return `Variation brutale de ${label} : ${v}${unit} (variation de ${pct}% par rapport à la moyenne)`;
  }
  return `Anomalie détectée sur ${label} : ${v}${unit}`;
}

// ── Détection principale ──────────────────────────────────────────────────────

export function detectAnomaly(
  sensorType: DataType,
  value: number,
  recentValues: number[],
  override?: ThresholdOverride,
): AlertDetection | null {
  const thresholds = THRESHOLDS[sensorType];

  // 1. Seuil haut — override prioritaire sur les defaults
  const highValue    = override?.highValue    ?? thresholds.high?.[0]?.value;
  const highSeverity = override?.highSeverity ?? thresholds.high?.[0]?.severity;

  if (highValue != null && highSeverity != null && value >= highValue) {
    return {
      type: "THRESHOLD_HIGH",
      severity: highSeverity,
      sensorType,
      value,
      threshold: highValue,
      message: buildMessage("THRESHOLD_HIGH", sensorType, value, highValue),
      suggestions: SUGGESTIONS[sensorType].THRESHOLD_HIGH,
    };
  }

  // Falls back to multi-level defaults if no override
  if (!override?.highValue && thresholds.high) {
    const triggered = [...thresholds.high].reverse().find((t) => value >= t.value);
    if (triggered) {
      return {
        type: "THRESHOLD_HIGH",
        severity: triggered.severity,
        sensorType,
        value,
        threshold: triggered.value,
        message: buildMessage("THRESHOLD_HIGH", sensorType, value, triggered.value),
        suggestions: SUGGESTIONS[sensorType].THRESHOLD_HIGH,
      };
    }
  }

  // 2. Seuil bas
  const lowValue    = override?.lowValue    ?? thresholds.low?.[0]?.value;
  const lowSeverity = override?.lowSeverity ?? thresholds.low?.[0]?.severity;

  if (lowValue != null && lowSeverity != null && value <= lowValue) {
    return {
      type: "THRESHOLD_LOW",
      severity: lowSeverity,
      sensorType,
      value,
      threshold: lowValue,
      message: buildMessage("THRESHOLD_LOW", sensorType, value, lowValue),
      suggestions: SUGGESTIONS[sensorType].THRESHOLD_LOW,
    };
  }

  if (!override?.lowValue && thresholds.low) {
    const triggered = [...thresholds.low].reverse().find((t) => value <= t.value);
    if (triggered) {
      return {
        type: "THRESHOLD_LOW",
        severity: triggered.severity,
        sensorType,
        value,
        threshold: triggered.value,
        message: buildMessage("THRESHOLD_LOW", sensorType, value, triggered.value),
        suggestions: SUGGESTIONS[sensorType].THRESHOLD_LOW,
      };
    }
  }

  // 3. Variation brutale (rolling average sur les N dernières valeurs)
  if (recentValues.length >= 3) {
    const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    if (avg !== 0) {
      const deviation = Math.abs(value - avg) / Math.abs(avg);
      if (deviation >= SUDDEN_CHANGE_THRESHOLD) {
        const severity: Severity =
          deviation >= 0.5 ? "HIGH" : "WARNING";
        const suggestions = SUGGESTIONS[sensorType].SUDDEN_CHANGE;
        if (suggestions.length === 0) return null;
        const pct = Math.round(Math.abs((value - avg) / Math.abs(avg)) * 100);
        return {
          type: "SUDDEN_CHANGE",
          severity,
          sensorType,
          value,
          threshold: pct,
          message: buildMessage("SUDDEN_CHANGE", sensorType, value, undefined, avg),
          suggestions,
        };
      }
    }
  }

  return null;
}
