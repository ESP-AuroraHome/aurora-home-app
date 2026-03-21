import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AlertsProvider } from "@/contexts/AlertsContext";
import Header from "@/components/specific/header";
import DashboardDatapoints from "@/features/datapoint/components/DashboardDatapoints";
import { getInitialDataPoints } from "@/features/datapoint/usecase/getInitialDataPoints";
import DashboardAlertShell from "@/features/notifications/components/DashboardAlertShell";
import { getAlerts } from "@/features/notifications/usecase/getAlerts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const t = await getTranslations();
  const [initialData, initialAlerts] = await Promise.all([
    getInitialDataPoints(),
    getAlerts(),
  ]);

  return (
    <AlertsProvider initialAlerts={initialAlerts}>
      <div className="flex flex-col h-screen w-full overflow-hidden">
        <Image
          src={"/assets/background-main.jpg"}
          fill
          alt="Background"
          className="object-cover object-center"
        />
        <div className="flex flex-col gap-6 md:gap-8 lg:gap-12 p-6 md:p-8 lg:p-12 pb-6 md:pb-8 lg:pb-12 overflow-y-auto flex-1 z-10">
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-15 md:gap-8 lg:gap-12">
            <Header />
            <div className="flex flex-col gap-6">
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-[150%] text-white font-semibold">
                {t("home.subtitle")}
              </h1>
              <DashboardAlertShell />
              <DashboardDatapoints initialData={initialData} />
            </div>
          </div>
        </div>
      </div>
    </AlertsProvider>
  );
}
