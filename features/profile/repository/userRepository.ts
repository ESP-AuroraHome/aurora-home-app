import type { User } from "@prisma/client";
import prisma from "@/lib/prisma";

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async update(
    id: string,
    data: Partial<Pick<User, "name" | "email" | "image" | "onboardingCompleted">>,
  ): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },
};
