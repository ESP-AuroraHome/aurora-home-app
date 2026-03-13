"use client";

import type { DataPoint, DataType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Item, ItemHeader } from "@/components/ui/item";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { getTitleForDataType, getUnitForDataType } from "../utils/wording";
import ChartDataPoint from "./ChartDatapoint";
import IconDataType from "./IconDataType";

interface Props {
  type: DataType;
  datapoints: DataPoint[];
}

function AnimatedValue({ value, unit }: { value: number; unit: string }) {
  const animatedValue = useAnimatedValue(value);
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      const timeout = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <p
      className={`text-2xl md:text-3xl font-bold transition-opacity duration-500 ${flash ? "opacity-60" : "opacity-100"}`}
    >
      {animatedValue.toFixed(2)} <span className="font-normal">{unit}</span>
    </p>
  );
}

const ItemDataPoint = ({ type, datapoints }: Props) => {
  const t = useTranslations("datapoint");
  const sortedDatapoints = [...datapoints].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const lastDatapoint = sortedDatapoints[0];

  const title = getTitleForDataType(type, t);
  const unit = getUnitForDataType(type);

  if (!lastDatapoint) {
    return (
      <Item
        variant={"outline"}
        className="bg-black/20 backdrop-blur-md border-0 rounded-3xl"
      >
        <ItemHeader className="justify-start">
          <div className="flex items-center gap-1.5">
            <IconDataType type={type} size={20} />
            <p className="font-semibold text-lg">{title}</p>
          </div>
        </ItemHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2 md:gap-4">
          <ChartDataPoint
            data={[]}
            type={type}
            className="w-full md:w-96 h-12 md:h-16"
            unit={unit}
          />
          <p>No data available</p>
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
          className="bg-black/20 backdrop-blur-md border-0 rounded-3xl cursor-pointer"
        >
          <ItemHeader className="justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <IconDataType type={type} size={20} />
                <p className="font-semibold text-lg">{title}</p>
              </div>

              <p className="text-slate-200 text-sm">
                {lastDatapoint.createdAt.toDateString()}
              </p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">
              {parseFloat(lastDatapoint.value).toFixed(2)}{" "}
              {getUnitForDataType(type)}
            </p>
          </ItemHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2 md:gap-4">
            <ChartDataPoint
              data={datapoints}
              type={type}
              className="w-full md:w-96 h-12 md:h-16"
              unit={getUnitForDataType(type)}
            />
          </div>
        </Item>
      </DrawerTrigger>
      <DrawerContent className="bg-black/20 backdrop-blur-md border-0 rounded-t-3xl">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <IconDataType type={type} size={20} />
                <DrawerTitle className="text-white text-xl md:text-2xl">
                  {title}
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-slate-200 text-sm">
                {lastDatapoint.createdAt.toDateString()}
              </DrawerDescription>
            </div>
            <AnimatedValue value={numericValue} unit={unit} />
          </div>
        </DrawerHeader>
        <div className="px-4 pb-6 md:px-10 md:pb-10 overflow-auto">
          <ChartDataPoint
            data={datapoints}
            type={type}
            unit={unit}
            className="w-full h-64 md:h-96"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ItemDataPoint;
