import type { DataType } from "@prisma/client";
import { Cloud, Droplet, Gauge, Sun, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  type: DataType;
  size?: number;
}

const IconDataType = ({ type, size = 16 }: Props) => {
  const className = "p-1 rounded-full";
  const resize = size + 8;
  switch (type) {
    case "TEMPERATURE":
      return (
        <Thermometer
          strokeWidth={2}
          size={resize}
          className={cn("bg-yellow-400", className)}
        />
      );
    case "HUMIDITY":
      return (
        <Droplet
          strokeWidth={1}
          size={resize}
          className={cn("bg-blue-400", className)}
        />
      );
    case "PRESSURE":
      return (
        <Gauge
          strokeWidth={1}
          size={resize}
          className={cn("bg-green-400", className)}
        />
      );
    case "CO2":
      return (
        <Cloud
          strokeWidth={1}
          size={resize}
          className={cn("bg-gray-400", className)}
        />
      );
    case "LIGHT":
      return (
        <Sun
          strokeWidth={1}
          size={resize}
          className={cn("bg-orange-400", className)}
        />
      );
    default:
      throw new Error(`Unknown DataType : ${type}`);
  }
};

export default IconDataType;
