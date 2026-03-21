"use client";

import type { AlertType, DataType, Severity } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SerializedDataPoint {
  id: string;
  type: DataType;
  value: string;
  createdAt: string;
}

export interface SerializedAlert {
  id: string;
  type: AlertType;
  severity: Severity;
  sensorType: DataType;
  value: number;
  threshold: number | null;
  message: string;
  suggestions: string[];
  read: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

type DataPointsByType = Record<DataType, SerializedDataPoint[]>;

interface SensorUpdate {
  type: "sensor_update";
  data: Record<string, SerializedDataPoint>;
}

interface AlertCreated {
  type: "alert_created";
  data: SerializedAlert;
}

const MAX_POINTS_PER_TYPE = 20;

export function useSensorData(
  initialData: DataPointsByType,
  initialAlerts: SerializedAlert[] = [],
) {
  const [data, setData] = useState<DataPointsByType>(initialData);
  const [alerts, setAlerts] = useState<SerializedAlert[]>(initialAlerts);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const es = new EventSource("/api/sensor-stream");
    esRef.current = es;

    es.onopen = () => {
      console.log("📡 SSE connecté");
    };

    es.onmessage = (event) => {
      try {
        const message: SensorUpdate | AlertCreated = JSON.parse(event.data);

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
              next[key] = [serialized, ...existing].slice(0, MAX_POINTS_PER_TYPE);
            }
            return next;
          });
        }

        if (message.type === "alert_created") {
          setAlerts((prev) => [message.data, ...prev]);
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
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      esRef.current?.close();
    };
  }, [connect]);

  const markAlertRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    );
  };

  const resolveAlertLocally = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, read: true, resolvedAt: new Date().toISOString() } : a,
      ),
    );
  };

  const markAllReadLocally = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return { data, alerts, unreadCount, markAlertRead, resolveAlertLocally, markAllReadLocally };
}
