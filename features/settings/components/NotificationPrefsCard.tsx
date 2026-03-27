"use client";

import type {
  DataType,
  NotificationSettings,
  SensorPreference,
  Severity,
} from "@prisma/client";
import { Cloud, Droplet, Gauge, Sun, Thermometer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import ButtonForm from "@/components/specific/buttonForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DATA_TYPES: DataType[] = [
  "TEMPERATURE",
  "HUMIDITY",
  "PRESSURE",
  "CO2",
  "LIGHT",
];

const SENSOR_META: Record<DataType, { icon: React.ReactNode }> = {
  TEMPERATURE: { icon: <Thermometer className="w-4 h-4" /> },
  HUMIDITY: { icon: <Droplet className="w-4 h-4" /> },
  PRESSURE: { icon: <Gauge className="w-4 h-4" /> },
  CO2: { icon: <Cloud className="w-4 h-4" /> },
  LIGHT: { icon: <Sun className="w-4 h-4" /> },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type LocalSensorPref = { enabled: boolean; minSeverity: Severity };
type LocalSettings = { quietStart: number | null; quietEnd: number | null };

interface Props {
  initialSensorPrefs: SensorPreference[];
  initialSettings: NotificationSettings | null;
}

export default function NotificationPrefsCard({
  initialSensorPrefs,
  initialSettings,
}: Props) {
  const t = useTranslations("settings");

  const [sensorPrefs, setSensorPrefs] = useState<
    Record<DataType, LocalSensorPref>
  >(
    () =>
      Object.fromEntries(
        DATA_TYPES.map((type) => {
          const found = initialSensorPrefs.find((p) => p.sensorType === type);
          return [
            type,
            {
              enabled: found?.enabled ?? true,
              minSeverity: found?.minSeverity ?? "WARNING",
            },
          ];
        }),
      ) as Record<DataType, LocalSensorPref>,
  );

  const [settings, setSettings] = useState<LocalSettings>({
    quietStart: initialSettings?.quietStart ?? null,
    quietEnd: initialSettings?.quietEnd ?? null,
  });

  const [savedSensorPrefs, setSavedSensorPrefs] = useState({ ...sensorPrefs });
  const [savedSettings, setSavedSettings] = useState({ ...settings });
  const [loading, setLoading] = useState(false);

  const hasChanges =
    JSON.stringify(sensorPrefs) !== JSON.stringify(savedSensorPrefs) ||
    JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const save = async () => {
    setLoading(true);
    try {
      await Promise.all([
        ...DATA_TYPES.map((type) =>
          fetch("/api/preferences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "sensor",
              sensorType: type,
              ...sensorPrefs[type],
            }),
          }),
        ),
        fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "settings", ...settings }),
        }),
      ]);
      setSavedSensorPrefs({ ...sensorPrefs });
      setSavedSettings({ ...settings });
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  };

  const quietEnabled =
    settings.quietStart !== null && settings.quietEnd !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-black/20 backdrop-blur-md rounded-3xl overflow-hidden">
        {DATA_TYPES.map((type, i) => {
          const meta = SENSOR_META[type];
          const pref = sensorPrefs[type];
          const isLast = i === DATA_TYPES.length - 1;

          return (
            <div
              key={type}
              className={`flex items-center gap-3 px-6 py-3 ${!isLast ? "border-b border-white/5" : ""}`}
            >
              <div className="flex items-center gap-2 text-white flex-1">
                <span className="text-white/60">{meta.icon}</span>
                <span className="text-sm">{t(`sensor.${type}`)}</span>
              </div>

              <div className="w-28">
                <Select
                  value={pref.minSeverity}
                  onValueChange={(v) =>
                    setSensorPrefs((prev) => ({
                      ...prev,
                      [type]: { ...prev[type], minSeverity: v as Severity },
                    }))
                  }
                  disabled={!pref.enabled}
                >
                  <SelectTrigger className="bg-white/10 border-white/10 h-8 text-xs text-white data-[placeholder]:text-white disabled:opacity-30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/10 backdrop-blur-xl border-white/10">
                    <SelectItem
                      value="WARNING"
                      className="text-white focus:bg-white/10 focus:text-white text-xs"
                    >
                      {t("severityWarning")}
                    </SelectItem>
                    <SelectItem
                      value="HIGH"
                      className="text-white focus:bg-white/10 focus:text-white text-xs"
                    >
                      {t("severityHigh")}
                    </SelectItem>
                    <SelectItem
                      value="CRITICAL"
                      className="text-white focus:bg-white/10 focus:text-white text-xs"
                    >
                      {t("severityCritical")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Switch
                checked={pref.enabled}
                onCheckedChange={(v) =>
                  setSensorPrefs((prev) => ({
                    ...prev,
                    [type]: { ...prev[type], enabled: v },
                  }))
                }
              />
            </div>
          );
        })}
      </div>

      <div className="bg-black/20 backdrop-blur-md rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-white text-sm font-semibold">
              {t("quietHours")}
            </span>
            <span className="text-white/40 text-xs">{t("quietHoursDesc")}</span>
          </div>
          <Switch
            checked={quietEnabled}
            onCheckedChange={(v) =>
              setSettings((_prev) =>
                !v
                  ? { quietStart: null, quietEnd: null }
                  : { quietStart: 23, quietEnd: 7 },
              )
            }
          />
        </div>

        {quietEnabled && (
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-white/50 text-xs">{t("quietFrom")}</span>
              <HourSelect
                value={settings.quietStart ?? 23}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, quietStart: v }))
                }
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-white/50 text-xs">{t("quietTo")}</span>
              <HourSelect
                value={settings.quietEnd ?? 7}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, quietEnd: v }))
                }
              />
            </div>
          </div>
        )}
      </div>

      {hasChanges && (
        <div className="bg-black/20 backdrop-blur-md rounded-3xl p-4">
          <ButtonForm
            loading={loading}
            text={t("save")}
            loadingText={t("saving")}
            variant="liquid-glass"
            onClick={save}
          />
        </div>
      )}
    </div>
  );
}

function HourSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="bg-white/10 border-white/10 h-8 text-xs flex-1 text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white/10 backdrop-blur-xl border-white/10 max-h-48">
        {HOURS.map((h) => (
          <SelectItem
            key={h}
            value={String(h)}
            className="text-white focus:bg-white/10 focus:text-white text-xs"
          >
            {String(h).padStart(2, "0")}:00
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
