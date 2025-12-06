import Header from "@/components/specific/header";
import ItemDataPoint from "@/features/datapoint/components/ItemDatapoint";
import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import getUserProfile from "@/features/profile/usecase/getUserProfile";

export default async function Home() {
  const t = await getTranslations();

  const profileResult = await getUserProfile();
  const name = profileResult.success ? profileResult.data.name : "";
  const temperatureDatapoints = await prisma.dataPoint.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      type: { equals: "TEMPERATURE" },
    },
    take: 20,
  });

  const humidityDatapoints = await prisma.dataPoint.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      type: { equals: "HUMIDITY" },
    },
    take: 20,
  });

  const lightDatapoints = await prisma.dataPoint.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      type: { equals: "LIGHT" },
    },
    take: 20,
  });

  const motionDatapoints = await prisma.dataPoint.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      type: { equals: "MOTION" },
    },
    take: 20,
  });

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <ItemDataPoint type="TEMPERATURE" datapoints={temperatureDatapoints} />
            <ItemDataPoint type="HUMIDITY" datapoints={humidityDatapoints} />
            <ItemDataPoint type="LIGHT" datapoints={lightDatapoints} />
            <ItemDataPoint type="MOTION" datapoints={motionDatapoints} />
          </div>
        </div>
      </div>
    </div>
  );
}
