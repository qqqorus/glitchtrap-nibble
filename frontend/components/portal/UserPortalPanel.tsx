"use client";

import { useChainGuard } from "@/hooks/useChainGuard";
import { useEffect, useState } from "react";
import { useConnection, useConnect, useConnectors, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { usePortalStore } from "@/stores/portal";
import { useDefenseStore } from "@/stores/defense";
import { contractConfig, AED_PER_ETH } from "@/lib/contract";
import { cn } from "@/lib/cn";
import { aed, shortAddr } from "@/lib/format";
import { useGraphStore } from "@/stores/graph";

const toAed = (wei: bigint) => Math.round(Number(formatEther(wei)) * AED_PER_ETH);
const BENEFIT_AMOUNT_AED = 200; // matches BENEFIT_AMOUNT constant in BenefitsPortal.sol

export function UserPortalPanel() {
  const { address, isConnected } = useConnection();
  const connect = useConnect();
  const connectors = useConnectors();

  const { wrongChain } = useChainGuard();

  const status = useDefenseStore((s) => s.status);
  const pushAlert = useDefenseStore((s) => s.pushAlert);
  const elevated = status === "UNDER_ATTACK" || status === "DEFENDED";

  const { hasStaked, hasClaimed, stakeReturned, setUserAddress, setHasStaked, setHasClaimed, setStakeReturned } = usePortalStore();

  const [now, setNow] = useState(Date.now());

  const { data: currentStakeWei } = useReadContract({
    ...contractConfig,
    functionName: "getCurrentStake",
    query: { refetchInterval: 3000 },
  });

  const { data: claimData } = useReadContract({
    ...contractConfig,
    functionName: "claims",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  const { data: hasWithdrawnOnChain } = useReadContract({
    ...contractConfig,
    functionName: "hasWithdrawn",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 },
  });


  const requiredStake = currentStakeWei ? toAed(currentStakeWei as bigint) : 20;

  const lock = useWriteContract();
  const claim = useWriteContract();
  const withdraw = useWriteContract();

  const lockReceipt = useWaitForTransactionReceipt({ hash: lock.data });
  const claimReceipt = useWaitForTransactionReceipt({ hash: claim.data });
  const withdrawReceipt = useWaitForTransactionReceipt({ hash: withdraw.data });

  const addRealUser = useGraphStore((s) => s.addRealUser);

  useEffect(() => {
    if (address) setUserAddress(address);
  }, [address, setUserAddress]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!address) {
      setHasStaked(false);
      setHasClaimed(false);
      setStakeReturned(false);
      return;
    }

    const [amount, , claimed, , slashed] = (claimData ?? [0n, 0n, false, false, false]) as readonly [
      bigint,
      bigint,
      boolean,
      boolean,
      boolean
    ];

    setHasStaked(amount > 0n && !slashed);
    setHasClaimed(claimed);
    setStakeReturned(!!hasWithdrawnOnChain);
  }, [
    address,
    claimData,
    hasWithdrawnOnChain,
    setHasStaked,
    setHasClaimed,
    setStakeReturned,
  ]);

  useEffect(() => {
    if (lockReceipt.isSuccess && address) {
      setHasStaked(true);
      addRealUser(address);
      pushAlert("success", `Stake locked: ${aed(requiredStake)}`);
    }
  }, [lockReceipt.isSuccess, address]);

  useEffect(() => {
    if (claimReceipt.isSuccess) {
      setHasClaimed(true);
      pushAlert("success", `Benefit claimed: ${aed(BENEFIT_AMOUNT_AED)}`);
    }
  }, [claimReceipt.isSuccess]);

  useEffect(() => {
    if (withdrawReceipt.isSuccess) {
      setStakeReturned(true);
      pushAlert("info", "Stake returned");
    }
  }, [withdrawReceipt.isSuccess]);

  const busy = lock.isPending || lockReceipt.isLoading || claim.isPending || claimReceipt.isLoading || withdraw.isPending || withdrawReceipt.isLoading;

  const LOCK_DURATION_SEC =30;
  const onChainLockTs = claimData
  ? Number((claimData as readonly [bigint, bigint, boolean, boolean, boolean])[1])
  : 0;

const secondsRemaining = onChainLockTs > 0
  ? Math.max(0, onChainLockTs + LOCK_DURATION_SEC - Math.floor(now / 1000))
  : 0;

const canWithdraw = secondsRemaining === 0 && hasClaimed;

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Wallet</p>
        {!isConnected ? (
          <button
            onClick={() =>
              connect.mutate(
                { connector: connectors[0] },
                { onError: (err) => pushAlert("danger", `Connect failed: ${err.message}`) }
              )
            }
            disabled={connectors.length === 0}
            className="w-full px-3 py-2 rounded border border-brand-purple/60 text-brand-purple hover:bg-brand-purple/10 text-sm font-medium transition-colors disabled:opacity-40">
            {connectors.length === 0 ? "No wallet detected" : "Connect Wallet"}
          </button>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded bg-bg-raised border border-border-subtle">
            <span className="font-mono text-xs text-text-primary">{shortAddr(address ?? "")}</span>
            <span className="w-2 h-2 rounded-full bg-state-safe" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Required Stake</p>
        <div className={cn("px-3 py-3 rounded border transition-colors", elevated ? "border-state-danger/60 bg-state-danger/5" : "border-border-subtle bg-bg-raised")}>
          <span className={cn("font-pixel text-[20px]", elevated ? "text-state-danger" : "text-text-primary")}>{aed(requiredStake)}</span>
          {elevated && <p className="mt-1 text-xs text-state-danger">System under attack. Stake requirement elevated.</p>}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Benefit Amount</p>
        <div className="px-3 py-2 rounded bg-bg-raised border border-border-subtle">
          <span className="text-sm text-text-primary">{aed(BENEFIT_AMOUNT_AED)}</span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border-subtle">
        {isConnected && !hasStaked && (
          <button
            onClick={() => currentStakeWei && lock.mutate({ ...contractConfig, functionName: "lockStake", value: currentStakeWei as bigint, gas: BigInt(300000) })}
            disabled={busy || !currentStakeWei || wrongChain}
            className="w-full px-3 py-2 rounded bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple-dim disabled:opacity-50 transition-colors"
          >
            {lock.isPending || lockReceipt.isLoading ? "Locking…" : `Lock Stake (${aed(requiredStake)})`}
          </button>
        )}

        {hasStaked && !hasClaimed && (
          <button
            onClick={() => claim.mutate({ ...contractConfig, functionName: "claimBenefit", gas: BigInt(300000) })}
            disabled={busy || wrongChain}
            className="w-full px-3 py-2 rounded bg-state-safe text-white text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-colors"
          >
            {claim.isPending || claimReceipt.isLoading ? "Claiming…" : `Claim Benefit (${aed(BENEFIT_AMOUNT_AED)})`}
          </button>
        )}

        {hasClaimed && !stakeReturned && (
          <button
              onClick={() => withdraw.mutate({ ...contractConfig, functionName: "withdrawStake", gas: BigInt(300000) })}
              disabled={busy || wrongChain || !canWithdraw}
              className="w-full px-3 py-2 rounded border border-border-strong text-text-primary text-sm font-medium hover:bg-bg-raised disabled:opacity-50 transition-colors"
            >
              {withdraw.isPending || withdrawReceipt.isLoading
                ? "Withdrawing…"
                : canWithdraw
                ? "Withdraw Stake"
                : `Withdraw in ${secondsRemaining}s`}
            </button>
        )}

        {stakeReturned && (
          <div className="px-3 py-2 rounded bg-state-safe/10 border border-state-safe/40 text-sm text-state-safe text-center">
            ✓ Stake returned. Net +{aed(BENEFIT_AMOUNT_AED)}.
          </div>
        )}

        {!isConnected && <p className="text-xs text-text-faint text-center pt-1">Connect your wallet to begin.</p>}
      </div>
    </div>
  );
}