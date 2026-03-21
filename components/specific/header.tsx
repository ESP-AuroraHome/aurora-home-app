import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import NotificationBellClient from "@/features/notifications/components/NotificationBellClient";
import { getAlerts } from "@/features/notifications/usecase/getAlerts";
import ProfileSheetProvider from "@/features/profile/components/ProfileSheetProvider";
import { auth } from "@/lib/auth";

const Header = async () => {
  const t = await getTranslations();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const name = session?.user?.name || "";
  const initialAlerts = await getAlerts();

  return (
    <header className="flex items-center gap-3 w-full text-white max-w-7xl mx-auto py-2 md:py-3">
      <ProfileSheetProvider />
      <div className="flex-1">
        <p className="leading-[150%] text-slate-200">
          {t("home.hello", { name: "" })}
        </p>
        <p className="text-2xl font-semibold">{name}</p>
      </div>
      <NotificationBellClient initialAlerts={initialAlerts} />
    </header>
  );
};

export default Header;
