import { DataType } from "@prisma/client";
import { Droplet, Gauge, Cloud, Sun, Thermometer } from "lucide-react";

interface Props {
  type: DataType;
  size?: number;
}

const IconDataType = ({ type, size = 16 }: Props) => {
  switch (type) {
    case "TEMPERATURE":
      return <Thermometer strokeWidth={1} size={size} />;
    case "HUMIDITY":
      return <Droplet strokeWidth={1} size={size} />;
    case "PRESSURE":
      return <Gauge strokeWidth={1} size={size} />;
    case "CO2":
      return <Cloud strokeWidth={1} size={size} />;
    case "LIGHT":
      return <Sun strokeWidth={1} size={size} />;
    default:
      throw new Error("Unknown DataType : " + type);
  }
};

export default IconDataType;
