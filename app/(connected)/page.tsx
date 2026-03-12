import Header from "@/components/specific/header";
import DashboardDatapoints from "@/features/datapoint/components/DashboardDatapoints";
import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import getUserProfile from "@/features/profile/usecase/getUserProfile";
import { DataType } from "@prisma/client";
import type { SerializedDataPoint } from "@/hooks/useSensorData";

export const dynamic = "force-dynamic";

const DATA_TYPES: DataType[] = [
  "TEMPERATURE",
  "HUMIDITY",
  "PRESSURE",
  "CO2",
  "LIGHT",
];

export default async function Home() {
  const t = await getTranslations();

  const profileResult = await getUserProfile({});
  const name = profileResult.success ? profileResult.data.name : "";

  const initialData = {} as Record<DataType, SerializedDataPoint[]>;

  for (const type of DATA_TYPES) {
    const datapoints = await prisma.dataPoint.findMany({
      orderBy: { createdAt: "desc" },
      where: { type: { equals: type } },
      take: 20,
    });
    initialData[type] = datapoints.map((dp) => ({
      ...dp,
      createdAt: dp.createdAt.toISOString(),
    }));
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[url('/assets/background-main.jpg')] bg-cover overflow-hidden">
      <div className="flex flex-col gap-6 md:gap-8 lg:gap-12 p-6 md:p-8 lg:p-12 pb-6 md:pb-8 lg:pb-12 overflow-y-auto flex-1">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 md:gap-8 lg:gap-12">
          <Header />
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-[150%] text-white">
            {t("home.hello", { name })}
            <br />
            {t("home.subtitle")}
          </h1>
          <DashboardDatapoints initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
