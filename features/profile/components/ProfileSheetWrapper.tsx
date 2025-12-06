"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="place-self-end self-center"
        aria-label="Ouvrir le profil"
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

