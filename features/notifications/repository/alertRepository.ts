import type { Alert, AlertType, DataType } from "@prisma/client";
import prisma from "@/lib/prisma";

const ANTI_SPAM_MINUTES = 30;

export const alertRepository = {
  async create(data: {
    type: AlertType;
    severity: Alert["severity"];
    sensorType: DataType;
    value: number;
    threshold?: number | null;
    message: string;
    suggestions: string[];
  }): Promise<Alert> {
    return prisma.alert.create({
      data: {
        type: data.type,
        severity: data.severity,
        sensorType: data.sensorType,
        value: data.value,
        threshold: data.threshold ?? null,
        message: data.message,
        suggestions: JSON.stringify(data.suggestions),
      },
    });
  },

  async findRecent(limit = 50): Promise<Alert[]> {
    return prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async findUnread(): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: { read: false },
      orderBy: { createdAt: "desc" },
    });
  },

  async countUnread(): Promise<number> {
    return prisma.alert.count({ where: { read: false } });
  },

  async markRead(id: string): Promise<Alert> {
    return prisma.alert.update({ where: { id }, data: { read: true } });
  },

  async markAllRead(): Promise<void> {
    await prisma.alert.updateMany({ where: { read: false }, data: { read: true } });
  },

  async resolve(id: string): Promise<Alert> {
    return prisma.alert.update({
      where: { id },
      data: { resolvedAt: new Date(), read: true },
    });
  },

  async resolveAll(): Promise<void> {
    await prisma.alert.updateMany({
      where: { resolvedAt: null },
      data: { resolvedAt: new Date(), read: true },
    });
  },

  // Anti-spam : vérifie si une alerte non résolue du même type/capteur existe récemment
  async hasRecentUnresolved(
    sensorType: DataType,
    type: AlertType,
  ): Promise<boolean> {
    const since = new Date(Date.now() - ANTI_SPAM_MINUTES * 60 * 1000);
    const count = await prisma.alert.count({
      where: {
        sensorType,
        type,
        resolvedAt: null,
        createdAt: { gte: since },
      },
    });
    return count > 0;
  },
};
