"use client";

import { User } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import ProfileCard from "./ProfileCard";
import { useTranslations } from "next-intl";

interface ProfileSheetProps {
  user: User;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSheet({
  user,
  locale,
  open,
  onOpenChange,
}: ProfileSheetProps) {
  const t = useTranslations("profile");
  const nameParts = user.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[url('/assets/background-main.jpg')] bg-cover bg-center overflow-auto w-full sm:max-w-lg p-0 border-l border-white/10 [&>button]:!top-4 [&>button]:!right-4 [&>button]:!bg-white/10 [&>button]:!backdrop-blur-sm [&>button]:!border [&>button]:!border-white/20 [&>button]:!text-white [&>button]:hover:!bg-white/20 [&>button]:hover:!border-white/30 [&>button]:!rounded-full [&>button]:!w-9 [&>button]:!h-9 [&>button]:!opacity-100 [&>button]:!transition-all [&>button]:!z-50 [&>button]:!flex [&>button]:!items-center [&>button]:!justify-center [&>button]:!cursor-pointer [&>button]:!shadow-lg">
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <div className="flex flex-col gap-6 p-6 pt-16">
          <ProfileCard
            user={user}
            locale={locale}
            initialData={{
              firstName,
              lastName,
              email: user.email,
              locale,
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

