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
  const margin = range * 0.1;

  let min = dataMin - margin;
  let max = dataMax + margin;

  switch (type) {
    case "PRESSURE":
      min = Math.max(min, 950);
      max = Math.max(max, 1050);
      break;
    case "HUMIDITY":
      min = Math.max(min, 0);
      max = Math.min(max, 100);
      break;
    case "TEMPERATURE":
      min = Math.floor(min);
      max = Math.ceil(max);
      break;
    case "CO2":
      min = Math.max(min, 300);
      break;
    case "LIGHT":
      min = Math.max(min, 0);
      break;
  }

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