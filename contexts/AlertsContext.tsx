"use client";

import { createContext, useContext } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import type { SerializedAlert } from "@/hooks/useSensorData";

type AlertsContextValue = ReturnType<typeof useAlerts>;

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({
  initialAlerts,
  initialIsWarmingUp = false,
  children,
}: {
  initialAlerts: SerializedAlert[];
  initialIsWarmingUp?: boolean;
  children: React.ReactNode;
}) {
  const value = useAlerts(initialAlerts, initialIsWarmingUp);
  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
}

export function useAlertsContext(): AlertsContextValue {
  const ctx = useContext(AlertsContext);
  if (!ctx)
    throw new Error("useAlertsContext must be used within AlertsProvider");
  return ctx;
}
