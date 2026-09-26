"use client";

import { useMemo } from "react";
import { ReactFlow, Background, BackgroundVariant, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "@/stores/graph";
import { GtNode } from "./GtNode";

const nodeTypes = { gt: GtNode };

export function NetworkGraph() {
  const storeNodes = useGraphStore((s) => s.nodes);
  const storeEdges = useGraphStore((s) => s.edges);

  const nodes: Node[] = useMemo(
    () =>
      storeNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as unknown as Record<string, unknown>,
        draggable: true,
      })),
    [storeNodes]
  );

  const edges: Edge[] = useMemo(
    () =>
      storeEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "var(--color-state-danger)", strokeWidth: 1, opacity: 0.4 },
      })),
    [storeEdges]
  );

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-sm text-text-faint font-mono">
          No activity yet — waiting for wallets to stake.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-border-subtle)" />
      </ReactFlow>

      <div className="absolute bottom-3 left-3 flex gap-3 text-[10px] font-mono text-text-faint bg-bg-panel/70 backdrop-blur px-2 py-1 rounded border border-border-subtle">
        <Legend color="var(--color-state-safe)" label="real" />
        <Legend color="var(--color-text-faint)" label="unverified" />
        <Legend color="var(--color-state-danger)" label="flagged" />
        <Legend color="var(--color-state-dead)" label="slashed" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}