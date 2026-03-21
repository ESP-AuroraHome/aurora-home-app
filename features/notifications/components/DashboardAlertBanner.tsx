"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import type { SerializedAlert } from "@/hooks/useSensorData";

interface DashboardAlertBannerProps {
  alerts: SerializedAlert[];
}

export default function DashboardAlertBanner({ alerts }: DashboardAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const critical = alerts.find((a) => a.severity === "CRITICAL" && !a.resolvedAt && !a.read);
  const high     = alerts.find((a) => a.severity === "HIGH"     && !a.resolvedAt && !a.read);
  const active   = critical ?? high;

  if (!active || dismissed) return null;

  const isCritical = active.severity === "CRITICAL";

  return (
    <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 border ${
      isCritical
        ? "bg-red-500/15 border-red-500/30"
        : "bg-orange-500/15 border-orange-500/30"
    }`}>
      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCritical ? "text-red-400" : "text-orange-400"}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCritical ? "text-red-300" : "text-orange-300"}`}>
          {active.message}
        </p>
        {active.suggestions[0] && (
          <p className="text-white/50 text-xs mt-0.5">{active.suggestions[0]}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
