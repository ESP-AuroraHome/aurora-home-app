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
