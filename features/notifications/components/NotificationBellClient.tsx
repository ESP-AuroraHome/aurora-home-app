"use client";

import { useAlertsContext } from "@/contexts/AlertsContext";
import NotificationSheet from "./NotificationSheet";

export default function NotificationBellClient() {
  const { alerts, unreadCount, markAlertRead, resolveAlertLocally, markAllReadLocally, resolveAllLocally } =
    useAlertsContext();

  return (
    <NotificationSheet
      alerts={alerts}
      unreadCount={unreadCount}
      onRead={markAlertRead}
      onResolve={resolveAlertLocally}
      onMarkAllRead={markAllReadLocally}
      onResolveAll={resolveAllLocally}
    />
  );
}
