"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { profileSchema, ProfileFormData } from "../utils/profileSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ButtonForm from "@/components/specific/buttonForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { SquarePen } from "lucide-react";

interface ProfileCardProps {
  user: User;
  locale: string;
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
    locale: string;
  };
}

type EditableField = "firstName" | "lastName" | "email" | "locale" | null;

export default function ProfileCard({
  user,
  locale,
  initialData,
}: ProfileCardProps) {
  const router = useRouter();
  const t = useTranslations("profile");
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<EditableField>(null);
  // État local pour les valeurs initiales (mise à jour après sauvegarde)
  const [currentInitialData, setCurrentInitialData] = useState(initialData);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentInitialData.firstName,
      lastName: currentInitialData.lastName,
      email: currentInitialData.email,
      locale: currentInitialData.locale as "fr" | "en",
    },
  });

  // Surveiller les valeurs du formulaire
  const watchedValues = form.watch();

  // Vérifier si des modifications ont été apportées
  const hasChanges =
    watchedValues.firstName !== currentInitialData.firstName ||
    watchedValues.lastName !== currentInitialData.lastName ||
    watchedValues.email !== currentInitialData.email ||
    watchedValues.locale !== currentInitialData.locale;

  // Extraire les initiales pour l'avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setEditingField(null);

    try {
      // Mettre à jour le profil
      const profileResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      // Mettre à jour la locale si elle a changé
      const localeChanged = data.locale !== initialData.locale;
      if (localeChanged) {
        const localeResponse = await fetch("/api/locale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ locale: data.locale }),
        });

        if (!localeResponse.ok) {
          throw new Error("Erreur lors de la mise à jour de la langue");
        }
      }

      // Mettre à jour les valeurs initiales pour masquer le bouton
      const newInitialData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        locale: data.locale,
      };
      setCurrentInitialData(newInitialData);
      
      // Réinitialiser le formulaire avec les nouvelles valeurs
      form.reset(newInitialData);

      // Si la locale a changé, rediriger avec un paramètre pour afficher le toast après le refresh
      if (localeChanged) {
        router.push("/profile?success=true");
        router.refresh();
      } else {
        // Si la locale n'a pas changé, on peut afficher le toast directement
        toast.success(t("success"));
        // Rafraîchir la page pour voir les changements
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFieldClick = (field: EditableField) => {
    if (field === "firstName" || field === "lastName") {
      // Pour le nom, on édite toujours les deux ensemble
      setEditingField("firstName");
    } else {
      setEditingField(field);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ne fermer l'édition que si le focus n'est pas passé à l'autre input du même groupe
    if (!loading) {
      const relatedTarget = e.relatedTarget as HTMLElement;
      // Si le focus passe à un autre input du même groupe d'édition, ne pas fermer
      if (editingField === "firstName" || editingField === "lastName") {
        const container = e.currentTarget.closest('.name-edit-container');
        if (container && relatedTarget && container.contains(relatedTarget)) {
          return; // Le focus est toujours dans le conteneur, ne pas fermer
        }
      }
      // Utiliser un timeout pour permettre au focus de se déplacer
      setTimeout(() => {
        // Vérifier si un input du conteneur a toujours le focus
        if (editingField === "firstName" || editingField === "lastName") {
          const container = e.currentTarget.closest('.name-edit-container');
          if (container) {
            const activeElement = document.activeElement;
            if (activeElement && container.contains(activeElement)) {
              return; // Un input a toujours le focus, ne pas fermer
            }
          }
        }
        setEditingField(null);
      }, 150);
    }
  };

  return (
    <Card className="bg-black/4 backdrop-blur-xs border-gray-100/50 rounded-3xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-white text-xl">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar avec initiales */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-semibold border border-white/30">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  {editingField === "firstName" || editingField === "lastName" ? (
                    <div className="flex gap-2 flex-1 name-edit-container">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all h-8 text-sm"
                                placeholder={t("firstNamePlaceholder")}
                                autoFocus
                                {...field}
                                onBlur={(e) => {
                                  field.onBlur();
                                  handleBlur(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-red-300 text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all h-8 text-sm"
                                placeholder={t("lastNamePlaceholder")}
                                {...field}
                                onBlur={(e) => {
                                  field.onBlur();
                                  handleBlur(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-red-300 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <p className="text-white text-lg font-semibold">
                        {watchedValues.firstName} {watchedValues.lastName}
                      </p>
                      <SquarePen
                        className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors"
                        onClick={() => handleFieldClick("firstName")}
                      />
                    </div>
                  )}
                </div>
                {editingField === "email" ? (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all h-8 text-sm"
                            placeholder={t("emailPlaceholder")}
                            autoFocus
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              handleBlur(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-300 text-xs" />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <p className="text-white/70 text-sm">
                      {watchedValues.email}
                    </p>
                    <SquarePen
                      className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors"
                      onClick={() => handleFieldClick("email")}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center group">
                <span className="text-white/70 text-sm">{t("language")}</span>
                {editingField === "locale" ? (
                  <FormField
                    control={form.control}
                    name="locale"
                    render={({ field }) => (
                      <FormItem className="flex-1 max-w-[200px]">
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setEditingField(null);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 focus:border-white/40 transition-all h-8 text-sm">
                              <SelectValue className="text-white" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20">
                            <SelectItem
                              value="fr"
                              className="text-white focus:bg-white/20"
                            >
                              Français
                            </SelectItem>
                            <SelectItem
                              value="en"
                              className="text-white focus:bg-white/20"
                            >
                              English
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-300 text-xs" />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-white font-medium">
                      {watchedValues.locale === "fr" ? "Français" : "English"}
                    </span>
                    <SquarePen
                      className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors"
                      onClick={() => handleFieldClick("locale")}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">{t("emailVerified")}</span>
                <span className="text-white font-medium">
                  {user.emailVerified ? "✓" : "✗"}
                </span>
              </div>
            </div>

            {/* Bouton de sauvegarde - affiché seulement s'il y a des changements */}
            {hasChanges && (
              <div className="pt-2 border-t border-white/10">
                <ButtonForm
                  loading={loading}
                  text={t("save")}
                  loadingText={t("saving")}
                />
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
