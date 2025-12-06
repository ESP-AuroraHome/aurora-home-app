"use client";

import { useMemo } from "react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DataPoint } from "@prisma/client";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface Props {
  data: DataPoint[];
  className?: string;
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const ChartDataPoint = ({ data, className }: Props) => {
  const chartData = useMemo(() => {
    const sortedData = [...data]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((dp) => ({
        value: Number(dp.value),
        createdAt: dp.createdAt,
        time: dp.createdAt.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: dp.createdAt.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      }));
    return sortedData;
  }, [data]);

  const uniqueId = useMemo(() => `chart-${Math.random().toString(36).substr(2, 9)}`, []);
  const isSmallChart = className?.includes("h-10");

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={`fillValue-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="white" stopOpacity={0.8} />
            <stop offset="95%" stopColor="white" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        {!isSmallChart && (
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
        )}
        {!isSmallChart && (
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
          />
        )}
        {!isSmallChart && (
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            width={40}
          />
        )}
        {!isSmallChart && (
          <ChartTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              
              const data = payload[0].payload;
              return (
                <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-white text-xs mb-1">
                    {data.date} {data.time}
                  </p>
                  <p className="text-white font-semibold">
                    {Number(payload[0].value).toFixed(2)}
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
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default ChartDataPoint;
