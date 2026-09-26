"use client";

import { Panel } from "@/components/layout/Panel";
import { Wordmark } from "@/components/brand/Wordmark";
import { UserPortalPanel } from "@/components/portal/UserPortalPanel";
import { useDefenseStore } from "@/stores/defense";
import { useGraphStore } from "@/stores/graph";
import { useBackendSocket } from "@/hooks/useBackendSocket";
import type { WsMessage } from "@/lib/types";

export default function Home() {
  const runAttack = useDefenseStore((s) => s.runAttack);
  const reset = useDefenseStore((s) => s.reset);

  useBackendSocket((msg: WsMessage) => {
    const defense = useDefenseStore.getState();
    const graph = useGraphStore.getState();

    switch (msg.type) {
      case "STATUS_UPDATE":
        defense.setStatus(msg.status);
        break;

      case "STAKE_REQUIREMENT_UPDATED":
        defense.setStakeRequirement(msg.requiredStake, msg.multiplier);
        break;

      case "CAPITAL_LOCKED":
        defense.setAttackerCapital(msg.amount);
        break;

      case "STAKE_LOCKED":
        graph.addStakeNode({
          address: msg.address,
          fundingSource: msg.fundingSource,
          flagged: msg.flagged,
          isReal: msg.isReal,
        });
        if (msg.isReal) {
          defense.pushAlert(
            "success",
            `Real stake: ${msg.address.slice(0, 6)}… ${msg.amount} AED`
          );
        }
        break;

      case "BENEFIT_CLAIMED":
        if (msg.isReal) {
          defense.pushAlert("success", `Benefit claimed: ${msg.amount} AED`);
        } else {
          defense.addAttackerBenefit(msg.amount);
        }
        break;

      case "STAKE_RETURNED":
        defense.pushAlert("info", `Stake returned: ${msg.address.slice(0, 6)}…`);
        break;

      case "ATTACK_DETECTED":
        defense.pushAlert("danger", msg.reason);
        graph.flagAll();
        break;

      case "SLASH_PROPOSAL":
        defense.setSlashProposal({
          wallets: msg.wallets.length,
          disputeSeconds: msg.disputeSeconds,
          deadline: Date.now() + msg.disputeSeconds * 1000,
          reason: msg.reason,
        });
        defense.pushAlert(
          "slash",
          `Slash proposal: ${msg.wallets.length} wallets, ${msg.disputeSeconds}s dispute`
        );
        break;

      case "SLASH_EXECUTED":
        defense.setSlashResults(msg.burned, msg.treasury, msg.attackerLoss);
        graph.slashAll();
        defense.pushAlert(
          "slash",
          `SLASH EXECUTED: ${msg.burned.toLocaleString()} AED burned`
        );
        break;

      case "RESET":
        defense.reset();
        graph.reset();
        break;
    }
  });

  return (
    <div className="p-6 space-y-4 min-h-screen">
      <Wordmark />

      <div className="grid grid-cols-[320px_1fr_380px] gap-4 h-[calc(100vh-110px)]">
        <Panel title="User Portal">
          <UserPortalPanel />
        </Panel>

        <Panel title="Network Graph">
          <div className="p-4 text-sm text-text-muted">Graph — Phase 4</div>
        </Panel>

        <Panel title="Defense Dashboard">
          <div className="p-4 space-y-2">
            <button
              onClick={() => runAttack({ swarmSize: 1000, disputeSeconds: 30 })}
              className="block w-full text-left px-3 py-2 rounded border border-state-danger/40 text-state-danger hover:bg-state-danger/10 text-sm"
            >
              ▸ Launch swarm (mock)
            </button>
            <button
              onClick={reset}
              className="block w-full text-left px-3 py-2 rounded border border-border-subtle hover:bg-bg-raised text-sm text-text-muted"
            >
              ▸ Reset (mock)
            </button>
            <p className="pt-2 text-xs text-text-faint">
              Live backend on ws://localhost:3001 is connected.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}