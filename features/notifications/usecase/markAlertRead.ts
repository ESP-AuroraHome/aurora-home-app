"use server";

import { alertRepository } from "../repository/alertRepository";

export async function markAlertRead(id: string): Promise<void> {
  await alertRepository.markRead(id);
}

export async function markAllAlertsRead(): Promise<void> {
  await alertRepository.markAllRead();
}
