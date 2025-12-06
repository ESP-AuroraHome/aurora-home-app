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
    <div className="flex flex-col gap-20 p-6 pb-0 h-screen w-full bg-[url('/assets/background-main.jpg')] bg-cover">
      <Header />
      <h1 className="text-2xl leading-[150%] text-white">
        {t("home.hello", { name })}
        <br />
        {t("home.subtitle")}
      </h1>
      <div className="flex flex-col gap-4 justify-end h-full overflow-auto pb-6">
        <ItemDataPoint type="TEMPERATURE" datapoints={temperatureDatapoints} />
        <ItemDataPoint type="HUMIDITY" datapoints={humidityDatapoints} />
        <ItemDataPoint type="LIGHT" datapoints={lightDatapoints} />
        <ItemDataPoint type="MOTION" datapoints={motionDatapoints} />
      </div>
    </div>
  );
}
