"use server";

import { alertRepository } from "../repository/alertRepository";

export async function resolveAlert(id: string): Promise<void> {
  await alertRepository.resolve(id);
}
