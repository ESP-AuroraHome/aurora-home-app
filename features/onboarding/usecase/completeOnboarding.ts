"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { userRepository } from "@/features/profile/repository/userRepository";

const onboardingSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  image: z.string().nullable().optional(),
  locale: z.enum(["fr", "en"]),
});

export default async function completeOnboarding(
  data: z.infer<typeof onboardingSchema>,
): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Utilisateur non authentifié");
  }

  const validated = onboardingSchema.parse(data);

  await userRepository.update(session.user.id, {
    name: validated.name,
    image: validated.image ?? null,
    onboardingCompleted: true,
  });

  const cookieStore = await cookies();
  cookieStore.set("locale", validated.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/");
}
