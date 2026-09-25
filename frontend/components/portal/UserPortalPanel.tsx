"use client";

import { useState } from "react";
import { usePortalStore } from "@/stores/portal";
import { useDefenseStore } from "@/stores/defense";
import { cn } from "@/lib/cn";
import { aed, shortAddr } from "@/lib/format";

export function UserPortalPanel() {
  const {
    userAddress,
    requiredStake,
    benefitAmount,
    hasStaked,
    hasClaimed,
    stakeReturned,
    setUserAddress,
    setHasStaked,
    setHasClaimed,
    setStakeReturned,
  } = usePortalStore();

  const status = useDefenseStore((s) => s.status);
  const pushAlert = useDefenseStore((s) => s.pushAlert);

  const [busy, setBusy] = useState(false);

  const elevated = status === "UNDER_ATTACK" || status === "DEFENDED";

  function connect() {
    setUserAddress("0xSarah7a3c9f2b8e4d6a1c5b9f3e7d2a8c4b6f1e9d3a7");
    pushAlert("success", "Wallet connected: 0xSarah…");
  }

  function lockStake() {
    setBusy(true);
    pushAlert("success", `Stake locked: ${aed(requiredStake)}`);
    setTimeout(() => {
      setHasStaked(true);
      setBusy(false);
    }, 700);
  }

  function claim() {
    setBusy(true);
    pushAlert("success", `Benefit claimed: ${aed(benefitAmount)}`);
    setTimeout(() => {
      setHasClaimed(true);
      setBusy(false);
    }, 700);
  }

  function withdraw() {
    setBusy(true);
    pushAlert("info", `Stake returned: ${aed(20)}`);
    setTimeout(() => {
      setStakeReturned(true);
      setBusy(false);
    }, 700);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Wallet
        </p>

        {!userAddress ? (
          <button
            onClick={connect}
            className="w-full px-3 py-2 rounded border border-brand-purple/60 text-brand-purple hover:bg-brand-purple/10 text-sm font-medium transition-colors"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded bg-bg-raised border border-border-subtle">
            <span className="font-mono text-xs text-text-primary">
              {shortAddr(userAddress)}
            </span>
            <span className="w-2 h-2 rounded-full bg-state-safe" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Required Stake
        </p>
        <div
          className={cn(
            "px-3 py-3 rounded border transition-colors",
            elevated
              ? "border-state-danger/60 bg-state-danger/5"
              : "border-border-subtle bg-bg-raised"
          )}
        >
          <span
            className={cn(
              "font-pixel text-[20px]",
              elevated ? "text-state-danger" : "text-text-primary"
            )}
          >
            {aed(requiredStake)}
          </span>
          {elevated && (
            <p className="mt-1 text-xs text-state-danger">
              System under attack. Stake requirement elevated.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Benefit Amount
        </p>
        <div className="px-3 py-2 rounded bg-bg-raised border border-border-subtle">
          <span className="text-sm text-text-primary">{aed(benefitAmount)}</span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border-subtle">
        {userAddress && !hasStaked && (
          <button
            onClick={lockStake}
            disabled={busy}
            className="w-full px-3 py-2 rounded bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple-dim disabled:opacity-50 transition-colors"
          >
            {busy ? "Locking…" : `Lock Stake (${aed(requiredStake)})`}
          </button>
        )}

        {hasStaked && !hasClaimed && (
          <button
            onClick={claim}
            disabled={busy}
            className="w-full px-3 py-2 rounded bg-state-safe text-white text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-colors"
          >
            {busy ? "Claiming…" : `Claim Benefit (${aed(benefitAmount)})`}
          </button>
        )}

        {hasClaimed && !stakeReturned && (
          <button
            onClick={withdraw}
            disabled={busy}
            className="w-full px-3 py-2 rounded border border-border-strong text-text-primary text-sm font-medium hover:bg-bg-raised disabled:opacity-50 transition-colors"
          >
            {busy ? "Withdrawing…" : "Withdraw Stake"}
          </button>
        )}

        {stakeReturned && (
          <div className="px-3 py-2 rounded bg-state-safe/10 border border-state-safe/40 text-sm text-state-safe text-center">
            ✓ Stake returned. Net +{aed(benefitAmount)}.
          </div>
        )}

        {!userAddress && (
          <p className="text-xs text-text-faint text-center pt-1">
            Connect your wallet to begin.
          </p>
        )}
      </div>
    </div>
  );
}