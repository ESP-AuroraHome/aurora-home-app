import { DataType } from "@prisma/client";

export const getTitleForDataType = (type: DataType, t?: (key: string) => string): string => {
  if (t) {
    switch (type) {
      case "TEMPERATURE":
        return t("temperature");
      case "HUMIDITY":
        return t("humidity");
      case "LIGHT":
        return t("light");
      case "MOTION":
        return t("motion");
      default:
        throw new Error("Unknown DataType : " + type);
    }
  }
  
  switch (type) {
    case "TEMPERATURE":
      return "Temperature";
    case "HUMIDITY":
      return "Humidity";
    case "LIGHT":
      return "Light";
    case "MOTION":
      return "Motion";
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
    case "LIGHT":
      return "lx";
    case "MOTION":
      return "mx";
    default:
      throw new Error("Unknown DataType : " + type);
  }
};
