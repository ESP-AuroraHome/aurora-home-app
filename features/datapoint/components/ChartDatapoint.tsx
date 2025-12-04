"use client";

import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { DataPoint } from "@prisma/client";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart
        accessibilityLayer
        data={data.map((dp) => ({
          value: Number(dp.value),
          createdAt: dp.createdAt.toISOString(),
        }))}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="createdAt"
          tickLine={false}
          axisLine={false}
          display={"none"}
        />
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="white" stopOpacity={0.8} />
            <stop offset="95%" stopColor="white" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="natural"
          fill="url(#fillValue)"
          fillOpacity={0.4}
          stroke="white"
          strokeWidth={2}
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default ChartDataPoint;
