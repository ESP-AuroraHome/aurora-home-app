"use client";

import type { DataPoint, DataType } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { calculateChartDomain } from "../utils/wording";

interface Props {
  data: DataPoint[];
  type?: DataType;
  className?: string;
  unit?: string;
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const ChartDataPoint = ({ data, type, className, unit }: Props) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const chartData = useMemo(() => {
    const sortedData = [...data].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    if (sortedData.length === 0) return [];

    const spanMs =
      sortedData[sortedData.length - 1].createdAt.getTime() -
      sortedData[0].createdAt.getTime();
    const spanHours = spanMs / (1000 * 60 * 60);

    const MAX_POINTS = 80;
    let sampled = sortedData;
    if (sortedData.length > MAX_POINTS) {
      const bucketSize = Math.ceil(sortedData.length / MAX_POINTS);
      sampled = [];
      for (let i = 0; i < sortedData.length; i += bucketSize) {
        const bucket = sortedData.slice(i, i + bucketSize);
        const avgValue =
          bucket.reduce((sum, dp) => sum + parseFloat(dp.value), 0) /
          bucket.length;
        const mid = bucket[Math.floor(bucket.length / 2)];
        sampled.push({ ...mid, value: avgValue.toFixed(2) });
      }
    }

    return sampled.map((dp) => {
      const numValue = parseFloat(String(dp.value));
      const value = Number.isNaN(numValue) ? 0 : numValue;

      let label: string;
      if (spanHours > 24) {
        label = new Date(dp.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        });
      } else if (spanHours > 2) {
        label = new Date(dp.createdAt).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        label = new Date(dp.createdAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return {
        value,
        createdAt: new Date(dp.createdAt),
        label,
        time: new Date(dp.createdAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: new Date(dp.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      };
    });
  }, [data]);

  const domain = useMemo(() => {
    if (!type) return undefined;
    const values = chartData.map((d) => d.value);
    const { min, max } = calculateChartDomain(type, values);
    return [min, max];
  }, [type, chartData]);

  const uniqueId = useMemo(
    () => `chart-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );
  const hasFixedHeight =
    className?.includes("h-10") ||
    className?.includes("h-12") ||
    className?.includes("h-16") ||
    className?.includes("h-20") ||
    className?.includes("h-24") ||
    className?.includes("h-32");
  const isOnlyFullWidth =
    className === "w-full" ||
    (className?.includes("w-full") && !hasFixedHeight);
  const isSmallChart = hasFixedHeight && !isOnlyFullWidth;

  const yAxisWidth = isMobile ? (unit ? 50 : 40) : unit ? 80 : 65;
  const marginLeft = isSmallChart
    ? isMobile
      ? 5
      : 5
    : isMobile
      ? unit
        ? 45
        : 35
      : unit
        ? 75
        : 60;
  const marginRight = isSmallChart ? (isMobile ? 5 : 5) : marginLeft;

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 10, right: marginRight, left: marginLeft, bottom: 10 }}
      >
        <defs>
          <linearGradient
            id={`fillValue-${uniqueId}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor="white" stopOpacity={0.8} />
            <stop offset="95%" stopColor="white" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        {!isSmallChart && (
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.1)"
          />
        )}
        {!isSmallChart && (
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            interval="preserveStartEnd"
          />
        )}
        <YAxis
          hide={isSmallChart}
          tickLine={false}
          axisLine={false}
          tick={{
            fill: "rgba(255,255,255,0.5)",
            fontSize: isMobile ? 10 : 11,
            style: { whiteSpace: "nowrap" },
          }}
          width={yAxisWidth}
          tickFormatter={(value) => {
            const numValue =
              typeof value === "number" ? value : parseFloat(String(value));
            if (Number.isNaN(numValue) || !Number.isFinite(numValue))
              return "--";

            let formatted: string;
            if (numValue >= 1000) {
              formatted = numValue.toFixed(0);
            } else if (numValue >= 100) {
              formatted =
                numValue % 1 === 0 ? numValue.toFixed(0) : numValue.toFixed(1);
            } else {
              formatted = numValue.toFixed(1);
            }

            return unit ? `${formatted}\u00A0${unit}` : formatted;
          }}
          domain={domain}
          interval="preserveStartEnd"
        />
        {!isSmallChart && (
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;

              const data = payload[0].payload;
              return (
                <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-white text-xs mb-1">
                    {data.date} {data.time}
                  </p>
                  <p className="text-white font-semibold">
                    {Number(payload[0].value).toFixed(2)}
                    {unit ? ` ${unit}` : ""}
                  </p>
                </div>
              );
            }}
          />
        )}
        <Area
          dataKey="value"
          type="monotone"
          fill={`url(#fillValue-${uniqueId})`}
          fillOpacity={0.4}
          stroke="white"
          strokeWidth={2}
          dot={false}
          activeDot={isSmallChart ? false : { r: 4, fill: "white" }}
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default ChartDataPoint;
