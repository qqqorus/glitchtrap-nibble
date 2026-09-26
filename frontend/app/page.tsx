"use client";

import { Panel } from "@/components/layout/Panel";
import { Wordmark } from "@/components/brand/Wordmark";
import { UserPortalPanel } from "@/components/portal/UserPortalPanel";
import { useDefenseStore } from "@/stores/defense";
import { useGraphStore } from "@/stores/graph";
import { useBackendSocket } from "@/hooks/useBackendSocket";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import { DefenseStats } from "@/components/dashboard/DefenseStats";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { ActivitySpike } from "@/components/dashboard/ActivitySpike";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

async function callBackend(path: string, body?: object) {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      useDefenseStore.getState().pushAlert("warn", data.error ?? `Backend ${path} failed`);
    }
  } catch {
    useDefenseStore.getState().pushAlert("warn", "Backend not reachable on :3001. Is `npm start` running?");
  }
}
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
          <NetworkGraph />
        </Panel>

        <Panel title="Defense Dashboard">
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <DefenseStats />
            <ActivitySpike />
            <AlertFeed />

            {/* Live backend controls */}
            <button
              onClick={() => callBackend("/simulate", { size: 1000 })}
              className="block w-full text-left px-3 py-2 rounded border border-state-danger/40 text-state-danger hover:bg-state-danger/10 text-sm"
            >
              ▸ Launch swarm (live)
            </button>
            <button
              onClick={() => callBackend("/submit-slash")}
              className="block w-full text-left px-3 py-2 rounded border border-state-slash/40 text-state-slash hover:bg-state-slash/10 text-sm"
            >
              ⚡ Submit slash proposal
            </button>
            <button
              onClick={() => callBackend("/reset")}
              className="block w-full text-left px-3 py-2 rounded border border-border-subtle hover:bg-bg-raised text-sm text-text-muted"
            >
              ▸ Reset (live)
            </button>

            {/* Offline fallback: scripted demo, no backend needed */}
            <div className="pt-2 border-t border-border-subtle space-y-2">
              <button
                onClick={() => runAttack({ swarmSize: 1000, disputeSeconds: 30 })}
                className="block w-full text-left px-3 py-1.5 rounded border border-border-subtle hover:bg-bg-raised text-xs text-text-faint"
              >
                ▸ Launch swarm (mock)
              </button>
              <button
                onClick={reset}
                className="block w-full text-left px-3 py-1.5 rounded border border-border-subtle hover:bg-bg-raised text-xs text-text-faint"
              >
                ▸ Reset (mock)
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
