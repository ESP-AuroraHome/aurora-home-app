import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
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
      <div>
        <p className=" leading-[150%] text-slate-200">
          {t("home.hello", { name: "" })}
        </p>
        <p className="text-2xl font-semibold">{name}</p>
      </div>
    </header>
  );
};

export default Header;
