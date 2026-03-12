"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Item, ItemHeader } from "@/components/ui/item";
import { DataPoint, DataType } from "@prisma/client";
import { getTitleForDataType, getUnitForDataType } from "../utils/wording";
import IconDataType from "./IconDataType";
import ChartDataPoint from "./ChartDatapoint";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Props {
  type: DataType;
  datapoints: DataPoint[];
}

function AnimatedValue({
  value,
  unit,
}: {
  value: number;
  unit: string;
}) {
  const animatedValue = useAnimatedValue(value);
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <p
      className={`text-2xl md:text-3xl font-bold transition-opacity duration-500 ${flash ? "opacity-60" : "opacity-100"}`}
    >
      {animatedValue.toFixed(2)}{" "}
      <span className="font-normal">{unit}</span>
    </p>
  );
}

const ItemDataPoint = ({ type, datapoints }: Props) => {
  const t = useTranslations("datapoint");
  const sortedDatapoints = [...datapoints].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const lastDatapoint = sortedDatapoints[0];

  const title = getTitleForDataType(type, t);
  const unit = getUnitForDataType(type);

  if (!lastDatapoint) {
    return (
      <Item
        variant={"outline"}
        className="bg-black/4 backdrop-blur-xs border-gray-100/50 rounded-3xl"
      >
        <ItemHeader className="justify-start">
          <IconDataType type={type} />
          {title}
        </ItemHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2 md:gap-4">
          <ChartDataPoint data={[]} type={type} className="w-full md:w-96 h-12 md:h-16" unit={unit} />
          <p className="text-2xl md:text-3xl font-bold">
            -- <span className="font-normal">{unit}</span>
          </p>
        </div>
      </Item>
    );
  }

  const numericValue = parseFloat(lastDatapoint.value);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Item
          variant={"outline"}
          className="bg-black/4 backdrop-blur-xs border-gray-100/50 rounded-3xl cursor-pointer transition-all duration-300"
        >
          <ItemHeader className="justify-start">
            <IconDataType type={type} />
            {title}
          </ItemHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2 md:gap-4">
            <ChartDataPoint data={datapoints} type={type} className="w-full md:w-96 h-12 md:h-16" unit={unit} />
            <AnimatedValue value={numericValue} unit={unit} />
          </div>
        </Item>
      </DrawerTrigger>
      <DrawerContent className="bg-black/90 backdrop-blur-2xl border-gray-100/50 max-h-[90vh] md:max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-white text-xl md:text-2xl">
            {title}
          </DrawerTitle>
          <DrawerDescription className="text-white/70">
            {t("recentDataPoints", { type: title })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-0 md:p-10 overflow-auto">
          <ChartDataPoint data={datapoints} type={type} unit={unit} className="w-full" />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ItemDataPoint;
