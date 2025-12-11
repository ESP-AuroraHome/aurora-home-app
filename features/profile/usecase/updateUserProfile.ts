"use server";

import usecase from "@/lib/usecase";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";
import { User } from "@prisma/client";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  image: z
    .union([
      z.string().refine(
        (val) => val.trim().length === 0 || val.startsWith("data:") || val.startsWith("http://") || val.startsWith("https://"),
        { message: "L'image doit être une URL valide ou une data URI" }
      ),
      z.null(),
    ])
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === null ? null : val)),
});

const updateUserProfile = usecase(
  async (
    data: z.infer<typeof updateProfileSchema>
  ): Promise<User> => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Utilisateur non authentifié");
    }

    const validatedData = updateProfileSchema.parse(data);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      throw new Error("Cet email est déjà utilisé");
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        image: validatedData.image ?? null,
      },
    });

    return updatedUser;
  }
);

export default updateUserProfile;

