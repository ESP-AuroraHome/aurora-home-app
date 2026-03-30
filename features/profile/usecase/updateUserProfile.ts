"use server";

import type { User } from "@prisma/client";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import usecase from "@/lib/usecase";
import { userRepository } from "../repository/userRepository";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  image: z.string().optional().nullable(),
});

const updateUserProfile = usecase(
  async (data: z.infer<typeof updateProfileSchema>): Promise<User> => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Utilisateur non authentifié");
    }

    const validatedData = updateProfileSchema.parse(data);

    const existingUser = await userRepository.findByEmail(validatedData.email);

    if (existingUser && existingUser.id !== session.user.id) {
      throw new Error("Cet email est déjà utilisé");
    }

    const updatedUser = await userRepository.update(session.user.id, {
      name: validatedData.name,
      email: validatedData.email,
      image: validatedData.image ?? null,
    });

    return updatedUser;
  },
);

export default updateUserProfile;
