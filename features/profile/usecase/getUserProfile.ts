"use server";

import type { User } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import usecase from "@/lib/usecase";
import { userRepository } from "../repository/userRepository";

const getUserProfile = usecase(async (): Promise<User> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Utilisateur non authentifié");
  }

  const user = await userRepository.findById(session.user.id);

  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }

  return user;
});

export default getUserProfile;
