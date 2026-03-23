"use client";

import type { DataType, Severity, SystemThreshold } from "@prisma/client";
import { Cloud, Droplet, Gauge, Minus, Plus, RotateCcw, Sun, Thermometer } from "lucide-react";
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

// ── Defaults (mirrors anomaly-detector.ts) ────────────────────────────────────

const DEFAULTS: Record<DataType, { highValue?: number; lowValue?: number }> = {
  TEMPERATURE: { highValue: 28,  lowValue: 14  },
  HUMIDITY:    { highValue: 70,  lowValue: 25  },
  PRESSURE:    {                 lowValue: 970 },
  CO2:         { highValue: 800               },
  LIGHT:       {},
};

const SENSOR_META: Record<DataType, { icon: React.ReactNode; unit: string }> = {
  TEMPERATURE: { icon: <Thermometer className="w-4 h-4" />, unit: "°C"  },
  HUMIDITY:    { icon: <Droplet className="w-4 h-4" />,     unit: "%"   },
  PRESSURE:    { icon: <Gauge className="w-4 h-4" />,       unit: "hPa" },
  CO2:         { icon: <Cloud className="w-4 h-4" />,       unit: "ppm" },
  LIGHT:       { icon: <Sun className="w-4 h-4" />,         unit: "lx"  },
};

const DATA_TYPES: DataType[] = ["TEMPERATURE", "HUMIDITY", "PRESSURE", "CO2", "LIGHT"];

type LocalThreshold = {
  highValue: string;
  highSeverity: Severity | "";
  lowValue: string;
  lowSeverity: Severity | "";
};

function toLocal(t?: SystemThreshold): LocalThreshold {
  return {
    highValue:    t?.highValue    != null ? String(t.highValue)    : "",
    highSeverity: t?.highSeverity ?? "",
    lowValue:     t?.lowValue     != null ? String(t.lowValue)     : "",
    lowSeverity:  t?.lowSeverity  ?? "",
  };
}

interface Props {
  initialThresholds: SystemThreshold[];
}

export default function ThresholdsCard({ initialThresholds }: Props) {
  const t = useTranslations("settings");

  const [values, setValues] = useState<Record<DataType, LocalThreshold>>(() => {
    const map = Object.fromEntries(
      DATA_TYPES.map((type) => [
        type,
        toLocal(initialThresholds.find((th) => th.sensorType === type)),
      ]),
    ) as Record<DataType, LocalThreshold>;
    return map;
  });

  const [saved, setSaved] = useState<Record<DataType, LocalThreshold>>({ ...values });
  const [loading, setLoading] = useState(false);

  const hasChanges = JSON.stringify(values) !== JSON.stringify(saved);

  const update = (type: DataType, field: keyof LocalThreshold, value: string) => {
    setValues((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
  };

  const reset = (type: DataType) => {
    setValues((prev) => ({ ...prev, [type]: toLocal(undefined) }));
  };

  const save = async () => {
    setLoading(true);
    try {
      await Promise.all(
        DATA_TYPES.map((type) => {
          const v = values[type];
          return fetch("/api/thresholds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sensorType:   type,
              highValue:    v.highValue    !== "" ? parseFloat(v.highValue)    : null,
              highSeverity: v.highSeverity !== "" ? v.highSeverity             : null,
              lowValue:     v.lowValue     !== "" ? parseFloat(v.lowValue)     : null,
              lowSeverity:  v.lowSeverity  !== "" ? v.lowSeverity              : null,
            }),
          });
        }),
      );
      setSaved({ ...values });
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {DATA_TYPES.map((type) => {
        const meta    = SENSOR_META[type];
        const def     = DEFAULTS[type];
        const v       = values[type];
        const hasHigh = def.highValue !== undefined;
        const hasLow  = def.lowValue  !== undefined;

        if (!hasHigh && !hasLow) return null;

        return (
          <div key={type} className="bg-black/20 backdrop-blur-md rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-white">
                {meta.icon}
                <span className="text-sm font-semibold">{t(`sensor.${type}`)}</span>
              </div>
              <button
                type="button"
                onClick={() => reset(type)}
                className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {t("reset")}
              </button>
            </div>

            {/* High threshold */}
            {hasHigh && (
              <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5">
                <span className="text-white/50 text-xs w-16 flex-shrink-0">{t("high")}</span>
                <div className="flex items-center gap-2 flex-1">
                  <NumberInput
                    value={v.highValue}
                    onChange={(val) => update(type, "highValue", val)}
                    placeholder={String(def.highValue)}
                    step={type === "PRESSURE" ? 1 : type === "CO2" ? 50 : 1}
                  />
                  <span className="text-white/30 text-xs flex-shrink-0">{meta.unit}</span>
                  <SeveritySelect
                    value={v.highSeverity}
                    onChange={(val) => update(type, "highSeverity", val)}
                    t={t}
                  />
                </div>
              </div>
            )}

            {/* Low threshold */}
            {hasLow && (
              <div className="flex items-center gap-3 px-6 py-3">
                <span className="text-white/50 text-xs w-16 flex-shrink-0">{t("low")}</span>
                <div className="flex items-center gap-2 flex-1">
                  <NumberInput
                    value={v.lowValue}
                    onChange={(val) => update(type, "lowValue", val)}
                    placeholder={String(def.lowValue)}
                    step={type === "PRESSURE" ? 1 : type === "CO2" ? 50 : 1}
                  />
                  <span className="text-white/30 text-xs flex-shrink-0">{meta.unit}</span>
                  <SeveritySelect
                    value={v.lowSeverity}
                    onChange={(val) => update(type, "lowSeverity", val)}
                    t={t}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Save button */}
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

function NumberInput({
  value,
  onChange,
  placeholder,
  step = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step?: number;
}) {
  const numeric = value !== "" ? parseFloat(value) : parseFloat(placeholder);

  const decrement = () => onChange(String(Number((numeric - step).toFixed(2))));
  const increment = () => onChange(String(Number((numeric + step).toFixed(2))));

  return (
    <div className="flex items-center h-8 rounded-xl overflow-hidden border border-white/10 bg-white/10 flex-shrink-0">
      <button
        type="button"
        onClick={decrement}
        className="px-2 h-full text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="px-2 text-white text-sm font-medium min-w-[3rem] text-center select-none">
        {value !== "" ? value : placeholder}
      </span>
      <button
        type="button"
        onClick={increment}
        className="px-2 h-full text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function SeveritySelect({
  value,
  onChange,
  t,
}: {
  value: Severity | "";
  onChange: (v: string) => void;
  t: ReturnType<typeof useTranslations<"settings">>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-white/10 border-white/10 h-8 text-xs flex-1 text-white data-[placeholder]:text-white">
        <SelectValue placeholder={t("severityPlaceholder")} />
      </SelectTrigger>
      <SelectContent className="bg-white/10 backdrop-blur-xl border-white/10">
        <SelectItem value="WARNING"  className="text-white focus:bg-white/10 focus:text-white text-xs">{t("severityWarning")}</SelectItem>
        <SelectItem value="HIGH"     className="text-white focus:bg-white/10 focus:text-white text-xs">{t("severityHigh")}</SelectItem>
        <SelectItem value="CRITICAL" className="text-white focus:bg-white/10 focus:text-white text-xs">{t("severityCritical")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
