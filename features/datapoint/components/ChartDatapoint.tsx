"use client";

import { useMemo, useState, useEffect } from "react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DataPoint, DataType } from "@prisma/client";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
    const sortedData = [...data]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((dp) => {
        // Parse la valeur en nombre, en gérant les cas d'erreur
        const numValue = parseFloat(dp.value);
        const value = isNaN(numValue) ? 0 : numValue;
        
        return {
          value,
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
        };
      });
    return sortedData;
  }, [data]);

  const domain = useMemo(() => {
    if (!type) return undefined;
    const values = chartData.map((d) => d.value);
    const { min, max } = calculateChartDomain(type, values);
    return [min, max];
  }, [type, chartData]);

  const uniqueId = useMemo(() => `chart-${Math.random().toString(36).substr(2, 9)}`, []);
  const isSmallChart = className?.includes("h-10");

  // Marges adaptatives selon la taille de l'écran
  // Augmenter la largeur pour éviter les retours à la ligne
  const yAxisWidth = isMobile ? (unit ? 50 : 40) : (unit ? 80 : 65);
  const marginLeft = isMobile ? (unit ? 45 : 35) : (unit ? 75 : 60);
  // Équilibrer la marge droite avec la gauche pour centrer le graphique
  const marginRight = marginLeft;

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 10, right: marginRight, left: marginLeft, bottom: 10 }}
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
        <YAxis
          hide={isSmallChart}
          tickLine={false}
          axisLine={false}
          tick={{ 
            fill: "rgba(255,255,255,0.5)", 
            fontSize: isMobile ? 10 : 11,
            style: { whiteSpace: 'nowrap' }
          }}
          width={yAxisWidth}
          tickFormatter={(value) => {
            // Formate les nombres pour éviter l'affichage de valeurs aberrantes
            const numValue = typeof value === 'number' ? value : parseFloat(String(value));
            if (isNaN(numValue) || !isFinite(numValue)) return '--';
            
            // Formatage intelligent selon la valeur
            let formatted: string;
            if (numValue >= 1000) {
              // Pour les grandes valeurs (>= 1000), pas de décimales
              formatted = numValue.toFixed(0);
            } else if (numValue >= 100) {
              // Pour les valeurs moyennes (100-999), 1 décimale si nécessaire
              formatted = numValue % 1 === 0 ? numValue.toFixed(0) : numValue.toFixed(1);
            } else {
              // Pour les petites valeurs (< 100), 1 décimale
              formatted = numValue.toFixed(1);
            }
            
            // Affiche la valeur et l'unité sur la même ligne avec un espace insécable
            return unit ? `${formatted}\u00A0${unit}` : formatted;
          }}
          domain={domain}
          interval="preserveStartEnd"
        />
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
                    {Number(payload[0].value).toFixed(2)}{unit ? ` ${unit}` : ""}
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
