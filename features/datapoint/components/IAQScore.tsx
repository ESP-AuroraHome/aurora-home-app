"use client";

import type { DataType } from "@prisma/client";
import { useTranslations } from "next-intl";
import type { SerializedDataPoint } from "@/hooks/useSensorData";

interface Props {
  data: Record<DataType, SerializedDataPoint[]>;
}

function getLatest(
  data: Record<DataType, SerializedDataPoint[]>,
  type: DataType,
): number | null {
  const points = data[type];
  if (!points || points.length === 0) return null;
  const sorted = [...points].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const val = parseFloat(sorted[0].value);
  return Number.isNaN(val) ? null : val;
}

function computeIAQ(
  temp: number | null,
  humidity: number | null,
  co2: number | null,
): number | null {
  if (temp === null && humidity === null && co2 === null) return null;

  let score = 0;
  let weight = 0;

  if (temp !== null) {
    weight += 33;
    if (temp >= 18 && temp <= 22) score += 33;
    else if (temp >= 15 && temp <= 26) score += 22;
    else if (temp >= 12 && temp <= 30) score += 11;
  }

  if (humidity !== null) {
    weight += 34;
    if (humidity >= 40 && humidity <= 60) score += 34;
    else if (humidity >= 30 && humidity <= 70) score += 22;
    else if (humidity >= 20 && humidity <= 80) score += 11;
  }

  if (co2 !== null) {
    weight += 33;
    if (co2 < 600) score += 33;
    else if (co2 < 1000) score += 22;
    else if (co2 < 1500) score += 11;
  }

  return Math.round((score / weight) * 100);
}

const LEVEL_KEYS = [
  {
    min: 80,
    key: "excellent" as const,
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bar: "bg-emerald-400",
  },
  {
    min: 60,
    key: "good" as const,
    dot: "bg-sky-400",
    text: "text-sky-300",
    bar: "bg-sky-400",
  },
  {
    min: 40,
    key: "moderate" as const,
    dot: "bg-yellow-400",
    text: "text-yellow-300",
    bar: "bg-yellow-400",
  },
  {
    min: 0,
    key: "poor" as const,
    dot: "bg-red-400",
    text: "text-red-300",
    bar: "bg-red-400",
  },
];

function getLevelKey(score: number) {
  return (
    LEVEL_KEYS.find((l) => score >= l.min) ?? LEVEL_KEYS[LEVEL_KEYS.length - 1]
  );
}

export default function IAQScore({ data }: Props) {
  const t = useTranslations("iaq");
  const temp = getLatest(data, "TEMPERATURE");
  const humidity = getLatest(data, "HUMIDITY");
  const co2 = getLatest(data, "CO2");
  const score = computeIAQ(temp, humidity, co2);

  if (score === null) return null;

  const level = getLevelKey(score);

  return (
    <div className="flex items-center gap-4 rounded-2xl px-4 py-3 bg-black/20 backdrop-blur-md border border-white/10">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${level.dot}`} />
        <p className="text-white text-sm font-medium">{t(level.key)}</p>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${level.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-slate-200 text-xs">{t(`${level.key}Desc`)}</p>
      </div>

      <span className={`text-sm font-bold flex-shrink-0 ${level.text}`}>
        {score}
        <span className="text-slate-200 font-normal text-xs">/100</span>
      </span>
    </div>
  );
}
