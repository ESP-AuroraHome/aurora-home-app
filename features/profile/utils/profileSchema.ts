import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  locale: z.enum(["fr", "en"], {
    message: "La langue est requise",
  }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

