"use client";

import type { DataType } from "@prisma/client";
import {
  CheckCheck,
  Cloud,
  Droplet,
  Gauge,
  Sun,
  Thermometer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { SerializedAlert } from "@/hooks/useSensorData";
import { markAlertRead } from "../usecase/markAlertRead";
import { resolveAlert } from "../usecase/resolveAlert";

const SEVERITY_STYLES = {
  WARNING: {
    bar: "border-yellow-400",
    badge: "bg-yellow-400/15 text-yellow-300",
  },
  HIGH: { bar: "border-orange-400", badge: "bg-orange-400/15 text-orange-300" },
  CRITICAL: { bar: "border-red-400", badge: "bg-red-400/15 text-red-300" },
};

const SENSOR_ICONS: Record<DataType, React.ReactNode> = {
  TEMPERATURE: <Thermometer className="w-4 h-4" />,
  HUMIDITY: <Droplet className="w-4 h-4" />,
  PRESSURE: <Gauge className="w-4 h-4" />,
  CO2: <Cloud className="w-4 h-4" />,
  LIGHT: <Sun className="w-4 h-4" />,
};

function useTimeAgo(dateStr: string): string {
  const t = useTranslations("notifications");
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (min < 1) return t("justNow");
  if (min < 60) return t("minutesAgo", { min });
  if (h < 24) return t("hoursAgo", { h });
  return t("daysAgo", { days: Math.floor(h / 24) });
}

interface AlertCardProps {
  alert: SerializedAlert;
  onRead: (id: string) => void;
  onResolve: (id: string) => void;
}

export default function AlertCard({
  alert,
  onRead,
  onResolve,
}: AlertCardProps) {
  const t = useTranslations("notifications");
  const tAlerts = useTranslations("alerts");
  const [isPending, startTransition] = useTransition();
  const style = SEVERITY_STYLES[alert.severity];
  const isResolved = !!alert.resolvedAt;
  const timeAgo = useTimeAgo(alert.createdAt);

  const severityLabel = {
    WARNING: t("severityWarning"),
    HIGH: t("severityHigh"),
    CRITICAL: t("severityCritical"),
  }[alert.severity];

  const sensor = tAlerts(`sensors.${alert.sensorType}`);
  const unit = {
    TEMPERATURE: "°C",
    HUMIDITY: "%",
    PRESSURE: " hPa",
    CO2: " ppm",
    LIGHT: " lx",
  }[alert.sensorType];
  const value = Number(alert.value).toFixed(1);

  const message = (() => {
    if (alert.type === "THRESHOLD_HIGH")
      return tAlerts("thresholdHigh", {
        sensor,
        value,
        unit,
        threshold: alert.threshold ?? "",
      });
    if (alert.type === "THRESHOLD_LOW")
      return tAlerts("thresholdLow", {
        sensor,
        value,
        unit,
        threshold: alert.threshold ?? "",
      });
    return tAlerts("suddenChange", {
      sensor,
      value,
      unit,
      pct: alert.threshold ?? "?",
    });
  })();

  const suggestionsRaw = tAlerts.raw(
    `suggestions.${alert.sensorType}.${alert.type}`,
  ) as Record<string, string>;
  const suggestions = Object.values(suggestionsRaw ?? {});

  const handleResolve = () => {
    startTransition(async () => {
      await resolveAlert(alert.id);
      onResolve(alert.id);
    });
  };

  const handleRead = () => {
    if (!alert.read) {
      startTransition(async () => {
        await markAlertRead(alert.id);
        onRead(alert.id);
      });
    }
  };

  return (
    <button
      type="button"
      className={`relative flex w-full gap-3 rounded-2xl p-4 text-left transition-all border-l-2 ${
        !alert.read && !isResolved ? "bg-white/8" : "bg-white/3"
      } ${isResolved ? "opacity-50" : ""} ${style.bar}`}
      onClick={handleRead}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${style.badge} mt-0.5`}
      >
        {SENSOR_ICONS[alert.sensorType]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className={`text-sm font-medium leading-snug ${isResolved ? "text-white/40" : "text-white"}`}
          >
            {message}
          </p>
          <span className="text-white/30 text-xs flex-shrink-0">{timeAgo}</span>
        </div>

        <span
          className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${style.badge}`}
        >
          {severityLabel}
        </span>

        {!isResolved && suggestions.length > 0 && (
          <div className="flex flex-col gap-1 mb-3">
            {suggestions.map((s) => (
              <div
                key={s}
                className="flex items-start gap-1.5 text-white/50 text-xs"
              >
                <span className="mt-0.5 flex-shrink-0 w-1 h-1 rounded-full bg-white/30" />
                {s}
              </div>
            ))}
          </div>
        )}

        {!isResolved && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResolve();
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-30"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {t("resolve")}
          </button>
        )}
      </div>

      {!alert.read && !isResolved && (
        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-white/60" />
      )}
    </button>
  );
}
