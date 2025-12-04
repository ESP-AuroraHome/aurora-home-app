"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function ProfileSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("profile");
  const success = searchParams.get("success");

  useEffect(() => {
    if (success === "true") {
      // Afficher le toast avec les traductions chargées
      toast.success(t("success"));
      // Nettoyer l'URL en enlevant le paramètre
      router.replace("/profile", { scroll: false });
    }
  }, [success, t, router]);

  return null;
}

