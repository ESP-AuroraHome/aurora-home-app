"use client";

import type { DataType } from "@prisma/client";
import { type SerializedDataPoint, useSensorData } from "@/hooks/useSensorData";
import ItemDataPoint from "./ItemDatapoint";

interface Props {
  initialData: Record<DataType, SerializedDataPoint[]>;
}

function toDataPoints(serialized: SerializedDataPoint[]) {
  return serialized.map((dp) => ({
    ...dp,
    createdAt: new Date(dp.createdAt),
  }));
}

const DATA_TYPES: DataType[] = [
  "TEMPERATURE",
  "HUMIDITY",
  "PRESSURE",
  "CO2",
  "LIGHT",
];

export default function DashboardDatapoints({ initialData }: Props) {
  const data = useSensorData(initialData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {DATA_TYPES.map((type) => (
        <ItemDataPoint
          key={type}
          type={type}
          datapoints={toDataPoints(data[type] || [])}
        />
      ))}
    </div>
  );
}
