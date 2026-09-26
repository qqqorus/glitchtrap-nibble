"use client";

import { Panel } from "@/components/layout/Panel";
import { Wordmark } from "@/components/brand/Wordmark";
import { UserPortalPanel } from "@/components/portal/UserPortalPanel";
import { useDefenseStore } from "@/stores/defense";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import { DefenseStats } from "@/components/dashboard/DefenseStats";
import { AlertFeed } from "@/components/dashboard/AlertFeed";

export default function Home() {
  const runAttack = useDefenseStore((s) => s.runAttack);
  const runSarah = useDefenseStore((s) => s.runSarah);
  const reset = useDefenseStore((s) => s.reset);

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
          <div className="p-4 space-y-4">
            <DefenseStats/>
            <AlertFeed />
            <button
              onClick={runSarah}
              className="block w-full text-left px-3 py-2 rounded border border-border-subtle hover:bg-bg-raised text-sm"
            >
              ▸ Run Sarah flow
            </button>
            <button
              onClick={() => runAttack({ swarmSize: 1000, disputeSeconds: 30 })}
              className="block w-full text-left px-3 py-2 rounded border border-state-danger/40 text-state-danger hover:bg-state-danger/10 text-sm"
            >
              ▸ Launch swarm (demo)
            </button>
            <button
              onClick={reset}
              className="block w-full text-left px-3 py-2 rounded border border-border-subtle hover:bg-bg-raised text-sm text-text-muted"
            >
              ▸ Reset
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}