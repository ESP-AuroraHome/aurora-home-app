import type { DataType } from "@prisma/client";
import type { SerializedDataPoint } from "@/hooks/useSensorData";
import { dataPointRepository } from "../repository/dataPointRepository";

const DATA_TYPES: DataType[] = [
  "TEMPERATURE",
  "HUMIDITY",
  "PRESSURE",
  "CO2",
  "LIGHT",
];

export async function getInitialDataPoints(): Promise<
  Record<DataType, SerializedDataPoint[]>
> {
  const initialData = {} as Record<DataType, SerializedDataPoint[]>;

  for (const type of DATA_TYPES) {
    const datapoints = await dataPointRepository.findLatestByType(type, 20);
    initialData[type] = datapoints.map((dp) => ({
      ...dp,
      createdAt: dp.createdAt,
    }));
  }

  return initialData;
}
