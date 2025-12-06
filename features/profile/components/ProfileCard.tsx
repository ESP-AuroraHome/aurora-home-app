"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { createProfileSchema, ProfileFormData } from "../utils/profileSchema";
import updateUserProfile from "../usecase/updateUserProfile";
import signOut from "@/features/auth/usecase/signOut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ButtonForm from "@/components/specific/buttonForm";
import { Spinner } from "@/components/ui/spinner";
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
import { SquarePen, LogOut } from "lucide-react";
import AvatarSelector from "./AvatarSelector";

interface ProfileCardProps {
  user: User;
  locale: string;
  initialData: {
    name: string;
    email: string;
    locale: string;
  };
  onSuccess?: () => void;
  hideTitle?: boolean;
}

type EditableField = "name" | "email" | "locale" | null;

export default function ProfileCard({
  user,
  locale,
  initialData,
  onSuccess,
  hideTitle = false,
}: ProfileCardProps) {
  const router = useRouter();
  const t = useTranslations("profile");
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [currentInitialData, setCurrentInitialData] = useState(initialData);
  const [initialAvatar, setInitialAvatar] = useState<string | null>(user.image);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user.image);

  const profileSchema = createProfileSchema(t);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentInitialData.name,
      email: currentInitialData.email,
      locale: currentInitialData.locale as "fr" | "en",
    },
  });

  const watchedValues = form.watch();

  const hasChanges =
    watchedValues.name !== currentInitialData.name ||
    watchedValues.email !== currentInitialData.email ||
    watchedValues.locale !== currentInitialData.locale ||
    selectedAvatar !== initialAvatar;


  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setEditingField(null);

    try {
      const profileResult = await updateUserProfile({
        name: data.name,
        email: data.email,
        image: selectedAvatar,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error || t("updateError"));
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
          throw new Error(t("localeUpdateError"));
        }
      }

      const updatedUser = profileResult.data;
      const newInitialData = {
        name: updatedUser.name,
        email: updatedUser.email,
        locale: data.locale,
      };
      setCurrentInitialData(newInitialData);
      setInitialAvatar(selectedAvatar);
      
      if (selectedAvatar) {
        user.image = selectedAvatar;
      } else {
        user.image = updatedUser.image;
      }
      
      user.name = updatedUser.name;
      
      form.reset(newInitialData);

      if (localeChanged) {
        const messages = await import(`@/messages/${data.locale}.json`);
        const successMessage = messages.default.profile.success;
        router.refresh();
        setTimeout(() => {
          toast.success(successMessage);
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 1000);
          }
        }, 100);
      } else {
        toast.success(t("success"));
        router.refresh();
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("unknownError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFieldClick = (field: EditableField) => {
    setEditingField(field);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!loading) {
      setTimeout(() => {
        setEditingField(null);
      }, 150);
    }
  };

  return (
    <Card className="bg-black/4 backdrop-blur-xs border-gray-100/50 rounded-3xl shadow-lg">
      {!hideTitle && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-xl">{t("title")}</CardTitle>
          <button
            onClick={async (e) => {
              e.preventDefault();
              setSigningOut(true);
              try {
                const result = await signOut({});
                if (result.success) {
                  router.push("/auth/login");
                } else {
                  toast.error(result.error || t("unknownError"));
                }
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : t("unknownError")
                );
              } finally {
                setSigningOut(false);
              }
            }}
            disabled={loading || signingOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/15 hover:border-white/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("signOut")}
            title={t("signOut")}
          >
            {signingOut ? (
              <Spinner className="w-4 h-4 text-white" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{t("signOut")}</span>
          </button>
        </CardHeader>
      )}
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
                  {editingField === "name" ? (
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all h-8 text-sm"
                              placeholder={t("namePlaceholder")}
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
                      <p className="text-white text-lg font-semibold">
                        {watchedValues.name}
                      </p>
                      <SquarePen
                        className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors"
                        onClick={() => handleFieldClick("name")}
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
                      {watchedValues.locale === "fr" ? t("french") : t("english")}
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
                  variant="liquid-glass"
                />
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
