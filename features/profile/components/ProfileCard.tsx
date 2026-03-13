"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ButtonForm from "@/components/specific/buttonForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useProfileSubmit } from "../hooks/useProfileSubmit";
import {
  createProfileSchema,
  type ProfileFormData,
} from "../utils/profileSchema";
import AvatarSelector from "./AvatarSelector";
import {
  EditableEmailField,
  type EditableField,
  EditableLocaleField,
  EditableNameField,
} from "./EditableFields";
import SignOutButton from "./SignOutButton";

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
  hideTitle = false,
}: ProfileCardProps) {
  const t = useTranslations("profile");
  const [editingField, setEditingField] = useState<EditableField>(null);
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

  const watchedValues = form.watch();
  const hasChanges =
    watchedValues.name !== currentInitialData.name ||
    watchedValues.email !== currentInitialData.email ||
    watchedValues.locale !== currentInitialData.locale ||
    selectedAvatar !== initialAvatar;

  const handleFieldClick = (field: EditableField) => setEditingField(field);
  const handleBlur = () => {
    if (!loading) setTimeout(() => setEditingField(null), 150);
  };

  return (
    <Card className="bg-black/20 backdrop-blur-md border-0 rounded-3xl">
      {!hideTitle && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-xl">{t("title")}</CardTitle>
          <SignOutButton disabled={loading} />
        </CardHeader>
      )}
      <CardContent className="flex flex-col gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-4">
              <AvatarSelector
                currentAvatar={selectedAvatar}
                userName={user.name}
                onSelect={setSelectedAvatar}
              />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <EditableNameField
                    form={form}
                    editingField={editingField}
                    onFieldClick={handleFieldClick}
                    onBlur={handleBlur}
                    t={t}
                  />
                </div>
                <EditableEmailField
                  form={form}
                  editingField={editingField}
                  onFieldClick={handleFieldClick}
                  onBlur={handleBlur}
                  t={t}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center group">
                <span className="text-white/70 text-sm">{t("language")}</span>
                <EditableLocaleField
                  form={form}
                  editingField={editingField}
                  onFieldClick={handleFieldClick}
                  setEditingField={setEditingField}
                  t={t}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">
                  {t("emailVerified")}
                </span>
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
