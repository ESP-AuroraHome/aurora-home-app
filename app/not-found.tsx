import { House } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden items-center justify-center">
      <Image
        src="/assets/background-main.jpg"
        fill
        alt="Background"
        className="object-cover object-center"
      />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
        <p className="text-8xl font-bold text-white/20 select-none">404</p>
        <div className="flex flex-col items-center gap-2">
          <p className="text-white text-xl font-semibold">{t("title")}</p>
          <p className="text-white/40 text-sm">{t("description")}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium transition-all"
        >
          <House strokeWidth={1} size={16} />
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
