"use server";

import type { Alert } from "@prisma/client";
import { alertRepository } from "../repository/alertRepository";

export interface SerializedAlert {
  id: string;
  type: Alert["type"];
  severity: Alert["severity"];
  sensorType: Alert["sensorType"];
  value: number;
  threshold: number | null;
  message: string;
  suggestions: string[];
  read: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

function serialize(alert: Alert): SerializedAlert {
  return {
    ...alert,
    suggestions: JSON.parse(alert.suggestions) as string[],
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    createdAt: alert.createdAt.toISOString(),
  };
}

export async function getAlerts(): Promise<SerializedAlert[]> {
  const alerts = await alertRepository.findRecent(50);
  return alerts.map(serialize);
}

export async function getUnreadCount(): Promise<number> {
  return alertRepository.countUnread();
}
