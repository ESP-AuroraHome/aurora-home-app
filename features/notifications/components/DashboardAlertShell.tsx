"use client";

import { useAlertsContext } from "@/contexts/AlertsContext";
import DashboardAlertBanner from "./DashboardAlertBanner";

export default function DashboardAlertShell() {
  const { alerts } = useAlertsContext();
  return <DashboardAlertBanner alerts={alerts} />;
}
