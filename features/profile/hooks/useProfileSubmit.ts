"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import updateUserProfile from "../usecase/updateUserProfile";
import type { ProfileFormData } from "../utils/profileSchema";

interface UseProfileSubmitParams {
  initialData: { name: string; email: string; locale: string };
  selectedAvatar: string | null;
  form: UseFormReturn<ProfileFormData>;
  onSuccess?: () => void;
  t: (key: string) => string;
  onUpdateState: (data: {
    newInitialData: { name: string; email: string; locale: string };
    updatedName: string;
    updatedImage: string | null;
  }) => void;
}

export function useProfileSubmit({
  initialData,
  selectedAvatar,
  form,
  onSuccess,
  t,
  onUpdateState,
}: UseProfileSubmitParams) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
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
        const resp = await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: data.locale }),
        });
        if (!resp.ok) throw new Error(t("localeUpdateError"));
      }

      const updatedUser = profileResult.data;
      const newInitialData = {
        name: updatedUser.name,
        email: updatedUser.email,
        locale: data.locale,
      };

      onUpdateState({
        newInitialData,
        updatedName: updatedUser.name,
        updatedImage: selectedAvatar ?? updatedUser.image,
      });
      form.reset(newInitialData);

      if (localeChanged) {
        const messages = await import(`@/messages/${data.locale}.json`);
        router.refresh();
        setTimeout(() => {
          toast.success(messages.default.profile.success);
          if (onSuccess) setTimeout(onSuccess, 1000);
        }, 100);
      } else {
        toast.success(t("success"));
        router.refresh();
        if (onSuccess) setTimeout(onSuccess, 1000);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  };

  return { loading, onSubmit };
}
