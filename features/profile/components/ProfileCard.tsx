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
import AvatarSelector from "./AvatarSelector";

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
  const [currentInitialData, setCurrentInitialData] = useState(initialData);
  const [initialAvatar, setInitialAvatar] = useState<string | null>(user.image);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user.image);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentInitialData.firstName,
      lastName: currentInitialData.lastName,
      email: currentInitialData.email,
      locale: currentInitialData.locale as "fr" | "en",
    },
  });

  const watchedValues = form.watch();

  const hasChanges =
    watchedValues.firstName !== currentInitialData.firstName ||
    watchedValues.lastName !== currentInitialData.lastName ||
    watchedValues.email !== currentInitialData.email ||
    watchedValues.locale !== currentInitialData.locale ||
    selectedAvatar !== initialAvatar;


  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setEditingField(null);

    try {
      const profileResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          image: selectedAvatar,
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

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

      const newInitialData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        locale: data.locale,
      };
      setCurrentInitialData(newInitialData);
      setInitialAvatar(selectedAvatar);
      
      if (selectedAvatar) {
        user.image = selectedAvatar;
      }
      
      form.reset(newInitialData);

      if (localeChanged) {
        router.push("/profile?success=true");
        router.refresh();
      } else {
        toast.success(t("success"));
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
      setEditingField("firstName");
    } else {
      setEditingField(field);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!loading) {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (editingField === "firstName" || editingField === "lastName") {
        const container = e.currentTarget.closest('.name-edit-container');
        if (container && relatedTarget && container.contains(relatedTarget)) {
          return;
        }
      }
      setTimeout(() => {
        if (editingField === "firstName" || editingField === "lastName") {
          const container = e.currentTarget.closest('.name-edit-container');
          if (container) {
            const activeElement = document.activeElement;
            if (activeElement && container.contains(activeElement)) {
              return;
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
            <div className="flex items-center gap-4">
              <AvatarSelector
                currentAvatar={selectedAvatar}
                userName={user.name}
                onSelect={(avatarUrl) => {
                  setSelectedAvatar(avatarUrl);
                }}
              />
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
