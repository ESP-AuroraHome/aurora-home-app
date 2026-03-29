"use client";

import { Bell, CheckCircle2, House } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SerializedAlert } from "@/hooks/useSensorData";
import { resolveAllAlerts } from "../usecase/markAlertRead";
import AlertCard from "./AlertCard";

type Tab = "all" | "unread" | "resolved";

interface NotificationSheetProps {
  alerts: SerializedAlert[];
  unreadCount: number;
  onRead: (id: string) => void;
  onResolve: (id: string) => void;
  onMarkAllRead: () => void;
  onResolveAll: () => void;
}

export default function NotificationSheet({
  alerts,
  unreadCount,
  onRead,
  onResolve,
  onMarkAllRead: _onMarkAllRead,
  onResolveAll,
}: NotificationSheetProps) {
  const t = useTranslations("notifications");
  const [tab, setTab] = useState<Tab>("all");
  const [isPending, startTransition] = useTransition();

  const filtered = alerts.filter((a) => {
    if (tab === "unread") return !a.read && !a.resolvedAt;
    if (tab === "resolved") return !!a.resolvedAt;
    return !a.resolvedAt;
  });

  const handleResolveAll = () => {
    startTransition(async () => {
      await resolveAllAlerts();
      onResolveAll();
    });
  };

  const activeAlerts = alerts.filter((a) => !a.resolvedAt);
  const hasActiveIssues = activeAlerts.length > 0;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: t("tabAll"), count: activeAlerts.length },
    { key: "unread", label: t("tabUnread"), count: unreadCount },
    {
      key: "resolved",
      label: t("tabResolved"),
      count: alerts.filter((a) => !!a.resolvedAt).length,
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 text-white ${
                alerts.some((a) => !a.read && a.severity === "CRITICAL")
                  ? "bg-red-500"
                  : alerts.some((a) => !a.read && a.severity === "HIGH")
                    ? "bg-orange-500"
                    : "bg-yellow-500"
              }`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-sm bg-black/60 backdrop-blur-2xl border-white/10 flex flex-col p-0"
      >
        <SheetHeader className="px-5 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white text-base font-semibold">
              {t("sheetTitle")}
            </SheetTitle>
          </div>
          {activeAlerts.length > 0 && (
            <button
              type="button"
              onClick={handleResolveAll}
              disabled={isPending}
              className="text-white/40 hover:text-white/70 text-xs transition-colors disabled:opacity-30 place-self-end"
            >
              {t("markAllRead")}
            </button>
          )}
          {!hasActiveIssues && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
              <House
                strokeWidth={1}
                size={20}
                className="bg-emerald-400 p-0.5 rounded-full flex-shrink-0"
              />
              <p className="text-emerald-300 text-xs font-medium">
                {t("allSensorsNormal")}
              </p>
            </div>
          )}

          <div className="flex gap-1 mt-3">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === t.key
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      tab === t.key ? "bg-white/20" : "bg-white/10"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium mb-1">
                  {tab === "resolved" ? t("emptyResolved") : t("emptyHealthy")}
                </p>
                <p className="text-white/40 text-xs leading-relaxed">
                  {tab === "resolved"
                    ? t("emptyResolvedDesc")
                    : t("emptyHealthyDesc")}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onRead={onRead}
                onResolve={onResolve}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
