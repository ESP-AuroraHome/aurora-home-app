"use client";

import { AlertTriangle, House, X } from "lucide-react";
import { useState } from "react";
import type { SerializedAlert } from "@/hooks/useSensorData";

interface DashboardAlertBannerProps {
  alerts: SerializedAlert[];
}

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, WARNING: 2 };

const SEVERITY_STYLES = {
  CRITICAL: {
    container: "bg-red-500/40 border-red-400/60",
    icon: "text-red-300",
    title: "text-red-100",
    badge: "bg-red-400/20 text-red-200",
    dot: "bg-red-400",
  },
  HIGH: {
    container: "bg-orange-500/40 border-orange-400/60",
    icon: "text-orange-300",
    title: "text-orange-100",
    badge: "bg-orange-400/20 text-orange-200",
    dot: "bg-orange-400",
  },
  WARNING: {
    container: "bg-yellow-500/30 border-yellow-400/50",
    icon: "text-yellow-300",
    title: "text-yellow-100",
    badge: "bg-yellow-400/20 text-yellow-200",
    dot: "bg-yellow-400",
  },
};

const SEVERITY_LABEL = { CRITICAL: "Urgent", HIGH: "Problème", WARNING: "Attention" };

export default function DashboardAlertBanner({ alerts }: DashboardAlertBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Alertes non résolues (indépendamment du dismiss visuel)
  const unresolvedAlerts = alerts.filter((a) => !a.resolvedAt && !a.read);

  const activeAlerts = unresolvedAlerts
    .filter((a) => !dismissedIds.has(a.id))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const isHealthy = unresolvedAlerts.length === 0;
  const allDismissed = unresolvedAlerts.length > 0 && activeAlerts.length === 0;

  if (isHealthy) {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-black/20 backdrop-blur-md border border-white/10">
        <House strokeWidth={1} size={24} className="bg-emerald-400 p-1 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">Votre maison est en bonne santé</p>
          <p className="text-white/40 text-xs mt-0.5">Tous les capteurs sont dans les normes</p>
        </div>
      </div>
    );
  }

  if (allDismissed) {
    const worstSeverity = unresolvedAlerts.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    )[0].severity;
    const dotColor = worstSeverity === "CRITICAL"
      ? "bg-red-400"
      : worstSeverity === "HIGH"
        ? "bg-orange-400"
        : "bg-yellow-400";
    return (
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-black/20 backdrop-blur-md border border-white/10">
        <div className="relative flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-medium">Surveillance en cours</p>
          <p className="text-white/40 text-xs mt-0.5">
            {unresolvedAlerts.length === 1
              ? "1 anomalie détectée — en attente de retour à la normale"
              : `${unresolvedAlerts.length} anomalies détectées — en attente de retour à la normale`}
          </p>
        </div>
      </div>
    );
  }

  const dismiss = (id: string) =>
    setDismissedIds((prev) => new Set([...prev, id]));

  return (
    <div className="flex flex-col gap-2">
      {activeAlerts.map((alert) => {
        const s = SEVERITY_STYLES[alert.severity];
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 border ${s.container}`}
          >
            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${s.icon}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-sm font-semibold leading-snug ${s.title}`}>
                  {alert.message}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${s.badge}`}>
                  {SEVERITY_LABEL[alert.severity]}
                </span>
              </div>
              {alert.suggestions[0] && (
                <p className="text-white/70 text-xs">{alert.suggestions[0]}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(alert.id)}
              className="text-white/50 hover:text-white/80 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
