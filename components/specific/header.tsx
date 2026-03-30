import { Settings } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { GlassButton } from "@/components/ui/glass-button";
import NotificationBellClient from "@/features/notifications/components/NotificationBellClient";
import ProfileSheetProvider from "@/features/profile/components/ProfileSheetProvider";
import { auth } from "@/lib/auth";

const Header = async () => {
  const t = await getTranslations();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const name = session?.user?.name || "";

  return (
    <header className="flex items-center gap-3 w-full text-white max-w-7xl mx-auto py-2 md:py-3">
      <ProfileSheetProvider />
      <div className="flex-1">
        <p className="leading-[150%] text-slate-200">
          {t("home.hello", { name: "" })}
        </p>
        <p className="text-2xl font-semibold">{name}</p>
      </div>
      <GlassButton asChild>
        <Link href="/settings">
          <Settings className="w-5 h-5" />
        </Link>
      </GlassButton>
      <NotificationBellClient />
    </header>
  );
};

export default Header;
