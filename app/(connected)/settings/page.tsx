import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AlertsProvider } from "@/contexts/AlertsContext";
import Header from "@/components/specific/header";
import NotificationPrefsCard from "@/features/settings/components/NotificationPrefsCard";
import ThresholdsCard from "@/features/settings/components/ThresholdsCard";
import { notificationPreferenceRepository } from "@/features/settings/repository/notificationPreferenceRepository";
import { thresholdRepository } from "@/features/settings/repository/thresholdRepository";
import { getAlerts } from "@/features/notifications/usecase/getAlerts";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [t, thresholds, sensorPrefs, notifSettings, initialAlerts] = await Promise.all([
    getTranslations("settings"),
    thresholdRepository.findAll(),
    notificationPreferenceRepository.findAllSensorPrefs(),
    notificationPreferenceRepository.findSettings(),
    getAlerts(),
  ]);

  return (
    <AlertsProvider initialAlerts={initialAlerts}>
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col gap-6 md:gap-8 lg:gap-12 p-6 md:p-8 lg:p-12 overflow-y-auto flex-1 z-10">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
          <Header />
          <div className="flex flex-col gap-6 max-w-sm mx-auto w-full">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex flex-col gap-0.5">
                <h1 className="text-white text-xl font-semibold">{t("title")}</h1>
                <p className="text-white/40 text-sm">{t("description")}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider px-1">{t("prefsTitle")}</h2>
              <NotificationPrefsCard initialSensorPrefs={sensorPrefs} initialSettings={notifSettings} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider px-1">{t("thresholdsTitle")}</h2>
              <ThresholdsCard initialThresholds={thresholds} />
            </div>
          </div>
        </div>
      </div>
    </div>
    </AlertsProvider>
  );
}
