import type { Session } from "@prisma/client";
import prisma from "@/lib/prisma";

export const sessionRepository = {
  async findByToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { token } });
  },
};
