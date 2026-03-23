"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SerializedAlert } from "./useSensorData";

export function useAlerts(initialAlerts: SerializedAlert[] = []) {
  const [alerts, setAlerts] = useState<SerializedAlert[]>(initialAlerts);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const es = new EventSource("/api/sensor-stream");
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type: string; data: SerializedAlert };
        if (message.type === "alert_created") {
          setAlerts((prev) => [message.data, ...prev]);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      reconnectRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      esRef.current?.close();
    };
  }, [connect]);

  const markAlertRead = (id: string) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));

  const resolveAlertLocally = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, read: true, resolvedAt: new Date().toISOString() } : a,
      ),
    );

  const markAllReadLocally = () =>
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));

  const resolveAllLocally = () =>
    setAlerts((prev) =>
      prev.map((a) => ({ ...a, read: true, resolvedAt: a.resolvedAt ?? new Date().toISOString() })),
    );

  const unreadCount = alerts.filter((a) => !a.read && !a.resolvedAt).length;

  return { alerts, unreadCount, markAlertRead, resolveAlertLocally, markAllReadLocally, resolveAllLocally };
}
