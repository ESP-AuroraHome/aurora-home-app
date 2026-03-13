"use client";

import type { User } from "@prisma/client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
        type="button"
        onClick={() => setOpen(true)}
        className="place-self-end self-center"
        aria-label={t("openProfile")}
      >
        <Image
          className="w-14 h-14 rounded-full object-cover"
          src={"/assets/default-profil.jpg"}
          alt={user.name}
          width={56}
          height={56}
        />
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
