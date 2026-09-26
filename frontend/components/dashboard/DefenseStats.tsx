"use client";

import { useEffect, useState } from "react";
import { useDefenseStore } from "@/stores/defense";
import { cn } from "@/lib/cn";
import { aed } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  NORMAL: "bg-state-safe/10 text-state-safe border-state-safe/40",
  UNDER_ATTACK: "bg-state-danger/10 text-state-danger border-state-danger/40 animate-pulse",
  DEFENDED: "bg-state-warn/10 text-state-warn border-state-warn/40",
  SLASHED: "bg-state-slash/10 text-state-slash border-state-slash/40",
};

function useCountdown(deadline?: number) {
  const [msLeft, setMsLeft] = useState(() => (deadline ? deadline - Date.now() : 0));
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setMsLeft(deadline - Date.now()), 200);
    return () => clearInterval(id);
  }, [deadline]);
  return Math.max(0, Math.ceil(msLeft / 1000));
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "safe" }) {
  return (
    <div className="px-2 py-1.5 rounded bg-bg-raised border border-border-subtle">
      <p className="text-[10px] uppercase tracking-wider text-text-faint">{label}</p>
      <p className={cn("text-sm font-medium", tone === "danger" && "text-state-danger", tone === "safe" && "text-state-safe", !tone && "text-text-primary")}>
        {value}
      </p>
    </div>
  );
}

export function DefenseStats() {
  const status = useDefenseStore((s) => s.status);
  const requiredStake = useDefenseStore((s) => s.requiredStake);
  const attackerCapital = useDefenseStore((s) => s.attackerCapital);
  const attackerLoss = useDefenseStore((s) => s.attackerLoss);
  const treasuryGain = useDefenseStore((s) => s.treasuryGain);
  const slashProposal = useDefenseStore((s) => s.slashProposal);
  const slashExecuted = useDefenseStore((s) => s.slashExecuted);
  const secondsLeft = useCountdown(slashProposal?.deadline);

  return (
    <div className="space-y-3">
      <div className={cn("px-3 py-2 rounded border text-xs font-mono uppercase tracking-wider text-center", STATUS_STYLES[status])}>
        Status: {status.replace("_", " ")}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Required Stake" value={aed(requiredStake)} />
        <Stat label="Attacker Capital" value={aed(attackerCapital)} tone={attackerCapital > 0 ? "danger" : undefined} />
      </div>

      {slashProposal && (
        <div className="px-3 py-2 rounded border border-state-slash/40 bg-state-slash/5 text-center">
          <p className="text-xs text-state-slash font-mono">Slash proposal submitted</p>
          <p className="text-2xl font-pixel text-state-slash mt-1">{secondsLeft}s</p>
          <p className="text-[11px] text-text-faint mt-1">{slashProposal.reason}</p>
        </div>
      )}

      {slashExecuted && (
        <div className="px-3 py-2 rounded border border-state-slash/40 bg-state-slash/5 space-y-1">
          <p className="text-xs text-state-slash font-mono text-center">⚡ SLASH EXECUTED</p>
          <Stat label="Attacker Net Loss" value={aed(attackerLoss)} tone="danger" />
          <Stat label="Treasury Gain" value={aed(treasuryGain)} tone="safe" />
        </div>
      )}
    </div>
  );
}