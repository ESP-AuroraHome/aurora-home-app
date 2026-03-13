"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import signOut from "@/features/auth/usecase/signOut";

interface SignOutButtonProps {
  disabled?: boolean;
}

export default function SignOutButton({ disabled }: SignOutButtonProps) {
  const router = useRouter();
  const t = useTranslations("profile");
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async (e: React.MouseEvent) => {
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
      toast.error(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={disabled || signingOut}
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
  );
}
