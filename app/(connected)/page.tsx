import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Header from "@/components/specific/header";
import ItemDataPoint from "@/features/datapoint/components/ItemDatapoint";
import { getInitialDataPoints } from "@/features/datapoint/usecase/getInitialDataPoints";

export const dynamic = "force-dynamic";

export default async function Home() {
  const t = await getTranslations();
  const initialData = await getInitialDataPoints();

  return (
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
          <div className="flex flex-col gap-10">
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-[150%] text-white font-semibold">
              {t("home.subtitle")}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <ItemDataPoint
                type="TEMPERATURE"
                datapoints={initialData.TEMPERATURE}
              />
              <ItemDataPoint
                type="HUMIDITY"
                datapoints={initialData.HUMIDITY}
              />
              <ItemDataPoint
                type="PRESSURE"
                datapoints={initialData.PRESSURE}
              />
              <ItemDataPoint type="CO2" datapoints={initialData.CO2} />
              <ItemDataPoint type="LIGHT" datapoints={initialData.LIGHT} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
