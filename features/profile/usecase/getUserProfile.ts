"use server";

import usecase from "@/lib/usecase";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { User } from "@prisma/client";

const getUserProfile = usecase(async (): Promise<User> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Utilisateur non authentifié");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }

  return user;
});

export default getUserProfile;

