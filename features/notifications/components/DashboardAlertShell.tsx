"use client";

import { useAlertsContext } from "@/contexts/AlertsContext";
import DashboardAlertBanner from "./DashboardAlertBanner";

export default function DashboardAlertShell() {
  const { alerts, isWarmingUp } = useAlertsContext();
  return <DashboardAlertBanner alerts={alerts} isWarmingUp={isWarmingUp} />;
}
