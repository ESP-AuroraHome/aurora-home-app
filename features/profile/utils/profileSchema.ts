import { z } from "zod";

export const createProfileSchema = (t: (key: string) => string) => {
  return z.object({
    name: z.string().min(1, t("nameRequired")),
    email: z.string().email(t("emailInvalid")).min(1, t("emailRequired")),
    locale: z.enum(["fr", "en"], {
      message: t("localeRequired"),
    }),
  });
};

export const profileSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  locale: z.enum(["fr", "en"], {
    message: "La langue est requise",
  }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

