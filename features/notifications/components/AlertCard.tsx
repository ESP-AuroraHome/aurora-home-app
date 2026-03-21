"use client";

import type { DataType } from "@prisma/client";
import { CheckCheck, Cloud, Droplet, Gauge, Sun, Thermometer } from "lucide-react";
import { useTransition } from "react";
import type { SerializedAlert } from "@/hooks/useSensorData";
import { markAlertRead } from "../usecase/markAlertRead";
import { resolveAlert } from "../usecase/resolveAlert";

const SEVERITY_STYLES = {
  WARNING:  { bar: "bg-yellow-400",  badge: "bg-yellow-400/15 text-yellow-300",  label: "Attention" },
  HIGH:     { bar: "bg-orange-400",  badge: "bg-orange-400/15 text-orange-300",  label: "Problème" },
  CRITICAL: { bar: "bg-red-400",     badge: "bg-red-400/15 text-red-300",        label: "Urgent" },
};

const SENSOR_ICONS: Record<DataType, React.ReactNode> = {
  TEMPERATURE: <Thermometer className="w-4 h-4" />,
  HUMIDITY:    <Droplet className="w-4 h-4" />,
  PRESSURE:    <Gauge className="w-4 h-4" />,
  CO2:         <Cloud className="w-4 h-4" />,
  LIGHT:       <Sun className="w-4 h-4" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const h   = Math.floor(diff / 3600000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

interface AlertCardProps {
  alert: SerializedAlert;
  onRead: (id: string) => void;
  onResolve: (id: string) => void;
}

export default function AlertCard({ alert, onRead, onResolve }: AlertCardProps) {
  const [isPending, startTransition] = useTransition();
  const style = SEVERITY_STYLES[alert.severity];
  const isResolved = !!alert.resolvedAt;

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
    <div
      className={`relative flex gap-3 rounded-2xl p-4 transition-all ${
        !alert.read && !isResolved
          ? "bg-white/8"
          : "bg-white/3"
      } ${isResolved ? "opacity-50" : ""}`}
      onClick={handleRead}
    >
      {/* Barre de sévérité */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${style.bar}`} />

      {/* Icône capteur */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${style.badge} mt-0.5`}>
        {SENSOR_ICONS[alert.sensorType]}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={`text-sm font-medium leading-snug ${isResolved ? "text-white/40" : "text-white"}`}>
            {alert.message}
          </p>
          <span className="text-white/30 text-xs flex-shrink-0">{timeAgo(alert.createdAt)}</span>
        </div>

        {/* Badge sévérité */}
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${style.badge}`}>
          {style.label}
        </span>

        {/* Suggestions */}
        {!isResolved && alert.suggestions.length > 0 && (
          <div className="flex flex-col gap-1 mb-3">
            {alert.suggestions.map((s) => (
              <div key={s} className="flex items-start gap-1.5 text-white/50 text-xs">
                <span className="mt-0.5 flex-shrink-0 w-1 h-1 rounded-full bg-white/30" />
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Bouton résoudre */}
        {!isResolved && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleResolve(); }}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-30"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marquer comme résolu
          </button>
        )}
      </div>

      {/* Point non lu */}
      {!alert.read && !isResolved && (
        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-white/60" />
      )}
    </div>
  );
}
