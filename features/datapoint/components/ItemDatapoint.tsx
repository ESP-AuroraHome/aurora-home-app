"use client";

import type { DataPoint, DataType } from "@prisma/client";
import { Download, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
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
import { useTrend } from "@/hooks/useTrend";
import { getTitleForDataType, getUnitForDataType } from "../utils/wording";
import ChartDataPoint from "./ChartDatapoint";
import IconDataType from "./IconDataType";

type Period = "live" | "1h" | "6h" | "24h" | "7j";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Live", value: "live" },
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7j", value: "7j" },
];

interface Props {
  type: DataType;
  datapoints: DataPoint[];
}

function AnimatedValue({
  value,
  unit,
  className = "",
}: {
  value: number;
  unit: string;
  className?: string;
}) {
  const animatedValue = useAnimatedValue(value);

  return (
    <p className={`font-bold ${className}`}>
      {animatedValue.toFixed(2)} <span className="font-normal">{unit}</span>
    </p>
  );
}

function TrendIndicator({
  type,
  values,
}: {
  type: DataType;
  values: number[];
}) {
  const t = useTranslations("datapoint");
  const trend = useTrend(type, values);

  if (trend === "up") {
    return (
      <span className="flex items-center gap-1 text-xs text-orange-300">
        <TrendingUp className="w-3.5 h-3.5" />
        {t("trendUp")}
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-300">
        <TrendingDown className="w-3.5 h-3.5" />
        {t("trendDown")}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-white/30">
      <Minus className="w-3.5 h-3.5" />
      {t("trendStable")}
    </span>
  );
}

const ItemDataPoint = ({ type, datapoints }: Props) => {
  const t = useTranslations("datapoint");
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("live");
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const sortedDatapoints = [...datapoints].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const lastDatapoint = sortedDatapoints[0];

  const title = getTitleForDataType(type, t);
  const unit = getUnitForDataType(type);

  const handlePeriodChange = async (newPeriod: Period) => {
    setPeriod(newPeriod);
    if (newPeriod === "live") {
      setHistoricalData([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/datapoints?type=${type}&period=${newPeriod}`,
      );
      const json = await res.json();
      setHistoricalData(
        json.map(
          (dp: {
            id: string;
            type: DataType;
            value: string;
            createdAt: string;
          }) => ({
            ...dp,
            createdAt: new Date(dp.createdAt),
          }),
        ),
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const displayedData =
    period === "live"
      ? datapoints
      : historicalData.length > 0
        ? historicalData
        : datapoints;

  const exportCSV = () => {
    const rows = [
      ["date", "value", "type"],
      ...displayedData.map((dp) => [
        new Date(dp.createdAt).toISOString(),
        dp.value,
        dp.type,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type.toLowerCase()}_${period}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
  const numericValues = sortedDatapoints
    .map((dp) => parseFloat(dp.value))
    .filter((v) => !Number.isNaN(v));

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Item
          variant={"outline"}
          className="bg-black/20 backdrop-blur-md border-0 rounded-3xl cursor-pointer transition-all duration-300"
        >
          <ItemHeader className="justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <IconDataType type={type} size={20} />
                <p className="font-semibold text-lg">{title}</p>
              </div>

              <p className="text-slate-200 text-sm">
                {lastDatapoint.createdAt
                  .toLocaleDateString(locale, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  .replace(/,/g, "")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <AnimatedValue
                value={numericValue}
                unit={unit}
                className="text-2xl md:text-3xl"
              />
              <TrendIndicator type={type} values={numericValues} />
            </div>
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
                {lastDatapoint.createdAt
                  .toLocaleDateString(locale, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  .replace(/,/g, "")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </DrawerDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <AnimatedValue
                value={numericValue}
                unit={unit}
                className="text-2xl md:text-3xl"
              />
              <TrendIndicator type={type} values={numericValues} />
            </div>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-6 md:px-10 md:pb-10 overflow-auto flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePeriodChange(p.value)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    period === p.value
                      ? "bg-white/20 border border-white/20 text-white font-medium"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-all"
            >
              <Download className="w-3 h-3" />
              {t("export")}
            </button>
          </div>
          <ChartDataPoint
            data={displayedData}
            type={type}
            unit={unit}
            className={`w-full h-64 md:h-96 transition-opacity duration-300 ${loadingHistory ? "opacity-30" : "opacity-100"}`}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ItemDataPoint;
