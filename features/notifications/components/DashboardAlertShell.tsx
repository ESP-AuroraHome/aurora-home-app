"use client";

import { useAlerts } from "@/hooks/useAlerts";
import type { SerializedAlert } from "@/hooks/useSensorData";
import DashboardAlertBanner from "./DashboardAlertBanner";

interface Props {
  initialAlerts: SerializedAlert[];
}

export default function DashboardAlertShell({ initialAlerts }: Props) {
  const { alerts } = useAlerts(initialAlerts);
  return <DashboardAlertBanner alerts={alerts} />;
}
