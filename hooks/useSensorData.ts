"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DataType } from "@prisma/client";

export interface SerializedDataPoint {
  id: string;
  type: DataType;
  value: string;
  createdAt: string;
}

type DataPointsByType = Record<DataType, SerializedDataPoint[]>;

interface SensorUpdate {
  type: "sensor_update";
  data: Record<string, SerializedDataPoint>;
}

const MAX_POINTS_PER_TYPE = 20;

export function useSensorData(initialData: DataPointsByType) {
  const [data, setData] = useState<DataPointsByType>(initialData);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const connect = useCallback(() => {
    const es = new EventSource("/api/sensor-stream");
    esRef.current = es;

    es.onopen = () => {
      console.log("📡 SSE connecté");
    };

    es.onmessage = (event) => {
      try {
        const message: SensorUpdate = JSON.parse(event.data);
        if (message.type === "sensor_update") {
          setData((prev) => {
            const next = { ...prev };
            for (const [dataType, dp] of Object.entries(message.data)) {
              const key = dataType as DataType;
              const serialized: SerializedDataPoint = {
                ...dp,
                createdAt:
                  typeof dp.createdAt === "string"
                    ? dp.createdAt
                    : new Date(dp.createdAt).toISOString(),
              };
              const existing = next[key] || [];
              next[key] = [serialized, ...existing].slice(
                0,
                MAX_POINTS_PER_TYPE
              );
            }
            return next;
          });
        }
      } catch (err) {
        console.error("Erreur parsing SSE message:", err);
      }
    };

    es.onerror = () => {
      es.close();
      console.log("📡 SSE déconnecté, reconnexion dans 3s...");
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      esRef.current?.close();
    };
  }, [connect]);

  return data;
}
