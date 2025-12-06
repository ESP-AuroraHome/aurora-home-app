import { DataType } from "@prisma/client";

export const getTitleForDataType = (type: DataType, t?: (key: string) => string): string => {
  if (t) {
    switch (type) {
      case "TEMPERATURE":
        return t("temperature");
      case "HUMIDITY":
        return t("humidity");
      case "PRESSURE":
        return t("pressure");
      case "CO2":
        return t("co2");
      case "LIGHT":
        return t("light");
      default:
        throw new Error("Unknown DataType : " + type);
    }
  }
  
  switch (type) {
    case "TEMPERATURE":
      return "Temperature";
    case "HUMIDITY":
      return "Humidity";
    case "PRESSURE":
      return "Pressure";
    case "CO2":
      return "CO2";
    case "LIGHT":
      return "Light";
    default:
      throw new Error("Unknown DataType : " + type);
  }
};

export const getUnitForDataType = (type: DataType): string => {
  switch (type) {
    case "TEMPERATURE":
      return "°C";
    case "HUMIDITY":
      return "%";
    case "PRESSURE":
      return "hPa";
    case "CO2":
      return "ppm";
    case "LIGHT":
      return "lx";
    default:
      throw new Error("Unknown DataType : " + type);
  }
};

export const calculateChartDomain = (
  type: DataType,
  values: number[]
): { min: number; max: number } => {
  if (values.length === 0) {
    // Valeurs par défaut si pas de données
    switch (type) {
      case "TEMPERATURE":
        return { min: 0, max: 30 };
      case "HUMIDITY":
        return { min: 0, max: 100 };
      case "PRESSURE":
        return { min: 950, max: 1050 };
      case "CO2":
        return { min: 300, max: 2000 };
      case "LIGHT":
        return { min: 0, max: 1000 };
      default:
        return { min: 0, max: 100 };
    }
  }

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;
  const margin = range * 0.1; // 10% de marge de chaque côté

  let min = dataMin - margin;
  let max = dataMax + margin;

  // Ajustements spécifiques selon le type
  switch (type) {
    case "PRESSURE":
      // La pression ne peut jamais être à 0, minimum réaliste ~950 hPa
      min = Math.max(min, 950);
      max = Math.max(max, 1050);
      break;
    case "HUMIDITY":
      // L'humidité est entre 0 et 100%
      min = Math.max(min, 0);
      max = Math.min(max, 100);
      break;
    case "TEMPERATURE":
      // Pas de limite stricte, mais on peut arrondir
      min = Math.floor(min);
      max = Math.ceil(max);
      break;
    case "CO2":
      // CO2 minimum réaliste ~300 ppm
      min = Math.max(min, 300);
      break;
    case "LIGHT":
      // La lumière peut être à 0
      min = Math.max(min, 0);
      break;
  }

  // Si min et max sont identiques, ajouter une marge minimale
  if (min === max) {
    switch (type) {
      case "PRESSURE":
        min -= 10;
        max += 10;
        break;
      case "TEMPERATURE":
        min -= 2;
        max += 2;
        break;
      default:
        min -= 1;
        max += 1;
    }
  }

  return { min, max };
};