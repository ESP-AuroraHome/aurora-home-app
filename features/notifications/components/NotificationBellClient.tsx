"use client";

import { useAlerts } from "@/hooks/useAlerts";
import type { SerializedAlert } from "@/hooks/useSensorData";
import NotificationSheet from "./NotificationSheet";

interface Props {
  initialAlerts: SerializedAlert[];
}

export default function NotificationBellClient({ initialAlerts }: Props) {
  const { alerts, unreadCount, markAlertRead, resolveAlertLocally, markAllReadLocally } =
    useAlerts(initialAlerts);

  return (
    <NotificationSheet
      alerts={alerts}
      unreadCount={unreadCount}
      onRead={markAlertRead}
      onResolve={resolveAlertLocally}
      onMarkAllRead={markAllReadLocally}
    />
  );
}
