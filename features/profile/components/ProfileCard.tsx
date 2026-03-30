"use client";

import {
  adventurer,
  avataaars,
  bottts,
  funEmoji,
  identicon,
  lorelei,
  micah,
  miniavs,
  openPeeps,
  personas,
  pixelArt,
  shapes,
  thumbs,
} from "@dicebear/collection";
import { createAvatar, type Style } from "@dicebear/core";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@prisma/client";
import { Check, SquarePen, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import ButtonForm from "@/components/specific/buttonForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfileSubmit } from "../hooks/useProfileSubmit";
import {
  createProfileSchema,
  type ProfileFormData,
} from "../utils/profileSchema";
import SignOutButton from "./SignOutButton";

const avatarStyles = [
  { name: "adventurer", generator: adventurer },
  { name: "avataaars", generator: avataaars },
  { name: "bottts", generator: bottts },
  { name: "fun-emoji", generator: funEmoji },
  { name: "identicon", generator: identicon },
  { name: "lorelei", generator: lorelei },
  { name: "micah", generator: micah },
  { name: "miniavs", generator: miniavs },
  { name: "open-peeps", generator: openPeeps },
  { name: "personas", generator: personas },
  { name: "pixel-art", generator: pixelArt },
  { name: "shapes", generator: shapes },
  { name: "thumbs", generator: thumbs },
];

const generateAvatar = (
  style: { name: string; generator: Style<{ seed: string; size: number }> },
  seed: string,
) => createAvatar(style.generator, { seed, size: 128 }).toDataUri();

interface ProfileCardProps {
  user: User;
  locale: string;
  initialData: { name: string; email: string; locale: string };
  onSuccess?: () => void;
  hideTitle?: boolean;
}

export default function ProfileCard({
  user,
  initialData,
  onSuccess,
}: ProfileCardProps) {
  const t = useTranslations("profile");
  const [editingField, setEditingField] = useState<
    "name" | "email" | "locale" | null
  >(null);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [currentInitialData, setCurrentInitialData] = useState(initialData);
  const [initialAvatar, setInitialAvatar] = useState<string | null>(user.image);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    user.image,
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(createProfileSchema(t)),
    defaultValues: {
      name: currentInitialData.name,
      email: currentInitialData.email,
      locale: currentInitialData.locale as "fr" | "en",
    },
  });

  const { loading, onSubmit } = useProfileSubmit({
    initialData,
    selectedAvatar,
    form,
    onSuccess,
    t,
    onUpdateState: ({ newInitialData, updatedName, updatedImage }) => {
      setCurrentInitialData(newInitialData);
      setInitialAvatar(selectedAvatar);
      user.image = updatedImage;
      user.name = updatedName;
    },
  });

  const avatarOptions = useMemo(
    () =>
      avatarStyles.map((style) => ({
        style: style.name,
        url: generateAvatar(
          style,
          currentInitialData.name || currentInitialData.email,
        ),
      })),
    [currentInitialData.name, currentInitialData.email],
  );

  const watchedValues = form.watch();
  const hasChanges =
    watchedValues.name !== currentInitialData.name ||
    watchedValues.email !== currentInitialData.email ||
    watchedValues.locale !== currentInitialData.locale ||
    selectedAvatar !== initialAvatar;

  const currentAvatarUrl = selectedAvatar ?? avatarOptions[0]?.url ?? "";

  const handleBlur = () => {
    if (!loading) setTimeout(() => setEditingField(null), 150);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="bg-black/20 backdrop-blur-md rounded-3xl overflow-hidden">
          {pickingAvatar ? (
            /* ── Avatar picker mode ── */
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  {t("chooseAvatar")}
                </span>
                <button
                  type="button"
                  onClick={() => setPickingAvatar(false)}
                  className="text-slate-200 hover:text-white/70 transition-colors"
                  aria-label={t("close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {avatarOptions.map((option) => {
                  const isSelected = selectedAvatar === option.url;
                  return (
                    <button
                      key={option.style}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(option.url);
                        setPickingAvatar(false);
                      }}
                      className={`relative rounded-full overflow-hidden border-2 aspect-square transition-all ${
                        isSelected
                          ? "border-white ring-2 ring-white/30 scale-105"
                          : "border-white/10 hover:border-white/40"
                      }`}
                    >
                      <Image
                        src={option.url}
                        alt={option.style}
                        fill
                        className="object-cover p-0.5"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Normal identity mode ── */
            <div className="p-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setPickingAvatar(true)}
                className="relative group"
                aria-label={t("changeAvatar")}
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/15 group-hover:border-white/30 transition-colors">
                  <Image
                    src={currentAvatarUrl}
                    alt={currentInitialData.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <SquarePen className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {editingField === "name" ? (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-[200px]">
                      <FormControl>
                        <Input
                          className="bg-white/10 border-white/20 text-white text-center h-9 text-base"
                          autoFocus
                          {...field}
                          onBlur={(_e) => {
                            field.onBlur();
                            handleBlur();
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && setEditingField(null)
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-red-300 text-xs text-center" />
                    </FormItem>
                  )}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingField("name")}
                  className="flex items-center gap-1.5 group"
                >
                  <span className="text-white text-lg font-semibold">
                    {watchedValues.name}
                  </span>
                  <SquarePen className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-200 transition-colors" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-black/20 backdrop-blur-md rounded-3xl overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
            <span className="text-slate-200 text-sm w-20 flex-shrink-0">
              {t("email")}
            </span>
            {editingField === "email" ? (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-0">
                    <FormControl>
                      <Input
                        type="email"
                        className="bg-white/10 border-white/20 text-white h-8 text-sm"
                        autoFocus
                        {...field}
                        onBlur={(_e) => {
                          field.onBlur();
                          handleBlur();
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-red-300 text-xs" />
                  </FormItem>
                )}
              />
            ) : (
              <div className="flex flex-1 min-w-0 items-center justify-end gap-2">
                <span className="text-white text-sm truncate">
                  {watchedValues.email}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingField("email")}
                  className="flex-shrink-0"
                >
                  <SquarePen className="w-3.5 h-3.5 text-slate-200 hover:text-slate-200 transition-colors" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
            <span className="text-slate-200 text-sm w-20 flex-shrink-0">
              {t("language")}
            </span>
            {editingField === "locale" ? (
              <FormField
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setEditingField(null);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white h-8 text-sm">
                          <SelectValue />
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
                  </FormItem>
                )}
              />
            ) : (
              <div className="flex flex-1 items-center justify-end gap-2">
                <span className="text-white text-sm">
                  {watchedValues.locale === "fr" ? t("french") : t("english")}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingField("locale")}
                  className="flex-shrink-0"
                >
                  <SquarePen className="w-3.5 h-3.5 text-slate-200 hover:text-slate-200 transition-colors" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 px-6 py-4">
            <span className="text-slate-200 text-sm w-20 flex-shrink-0">
              {t("emailVerified")}
            </span>
            <div className="flex flex-1 justify-end">
              {user.emailVerified ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-400/80 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3" />
                  {t("verified")}
                </span>
              ) : (
                <span className="text-xs font-medium text-red-900 bg-red-400/80 px-2.5 py-1 rounded-full">
                  {t("notVerified")}
                </span>
              )}
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-black/20 backdrop-blur-md rounded-3xl p-4">
            <ButtonForm
              loading={loading}
              text={t("save")}
              loadingText={t("saving")}
              variant="liquid-glass"
            />
          </div>
        )}

        <div className="bg-black/20 backdrop-blur-md rounded-3xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">{t("signOut")}</p>
            <p className="text-slate-200 text-xs mt-0.5">
              {t("signOutDescription")}
            </p>
          </div>
          <SignOutButton disabled={loading} />
        </div>
      </form>
    </Form>
  );
}
