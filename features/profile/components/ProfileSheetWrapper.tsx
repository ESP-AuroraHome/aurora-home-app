"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { User } from "@prisma/client";
import { User as UserIcon } from "lucide-react";
import ProfileSheet from "./ProfileSheet";

interface ProfileSheetWrapperProps {
  user: User;
  locale: string;
}

export default function ProfileSheetWrapper({
  user,
  locale,
}: ProfileSheetWrapperProps) {
  const t = useTranslations("profile");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="place-self-end self-center"
        aria-label={t("openProfile")}
      >
        <UserIcon size={24} strokeWidth={1} className="text-white" />
      </button>
      <ProfileSheet
        user={user}
        locale={locale}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

