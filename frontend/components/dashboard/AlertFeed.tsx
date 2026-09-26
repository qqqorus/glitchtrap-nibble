"use client";

import { useDefenseStore } from "@/stores/defense";
import { cn } from "@/lib/cn";
import type { AlertKind } from "@/lib/types";

const KIND_STYLES: Record<AlertKind, string> = {
  info: "text-text-muted",
  warn: "text-state-warn",
  danger: "text-state-danger",
  success: "text-state-safe",
  slash: "text-state-slash",
};

export function AlertFeed() {
  const alerts = useDefenseStore((s) => s.alerts);

  if (alerts.length === 0) {
    return <p className="text-xs text-text-faint font-mono px-1">No alerts yet.</p>;
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
      {alerts.map((a) => (
        <p key={a.id} className={cn("text-xs font-mono leading-snug", KIND_STYLES[a.kind])}>
          <span className="text-text-faint">[{new Date(a.ts).toLocaleTimeString()}]</span> {a.text}
        </p>
      ))}
    </div>
  );
}