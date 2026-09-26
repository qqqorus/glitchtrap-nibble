import { create } from "zustand";
import type { GraphNodeData, GraphNodeKind } from "@/lib/types";

export type RfNode = {
  id: string;
  type: "gt";
  position: { x: number; y: number };
  data: GraphNodeData;
};

export type RfEdge = {
  id: string;
  source: string;
  target: string;
};

type GraphState = {
  nodes: RfNode[];
  edges: RfEdge[];
  swarmSize: number;

  addRealUser: (id: string) => void;
  addSwarm: (count: number, masterId: string, visualLimit?: number) => void;
  addStakeNode: (opts: {
    address: string;
    fundingSource?: string;
    flagged: boolean;
    isReal: boolean;
  }) => void;
  flagAll: () => void;
  slashAll: () => void;
  reset: () => void;
};


export const FLOOD_DURATION_MS = 2400; // matches the "flood in over ~2-3s" beat from the demo script

const MASTER_POS = { x: 600, y: 400 };
const RING_CAPACITY = 60;

function ringPosition(i: number, visual: number) {
  const ring = Math.floor(i / RING_CAPACITY);
  const ringStart = ring * RING_CAPACITY;
  const countInRing = Math.min(RING_CAPACITY, visual - ringStart);
  const indexInRing = i - ringStart;
  const angle = (indexInRing / countInRing) * Math.PI * 2 + ring * 0.4;
  const baseRadius = 140 + ring * 90;
  const jitter = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 16 - 8; // deterministic, no Math.random() flicker on re-render
  return {
    x: MASTER_POS.x + Math.cos(angle) * (baseRadius + jitter),
    y: MASTER_POS.y + Math.sin(angle) * (baseRadius + jitter),
  };
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  swarmSize: 0,

  addRealUser: (id) => {
  set((s) => {
    if (s.nodes.some((n) => n.id === id)) return s; // already added, skip
    return {
      nodes: [...s.nodes, { id, type: "gt", position: { x: 150, y: 150 }, data: { kind: "real" } }],
    };
  });
},

  addSwarm: (count, masterId, visualLimit = 400) => {
    const visual = Math.min(count, visualLimit);
    const master: RfNode = {
      id: masterId,
      type: "gt",
      position: MASTER_POS,
      data: { kind: "master" },
    };

    const swarm: RfNode[] = [];
    const edges: RfEdge[] = [];

    for (let i = 0; i < visual; i++) {
      const id = `sw-${i}`;
      swarm.push({
        id,
        type: "gt",
        position: ringPosition(i, visual),
        data: { kind: "unverified", delayMs: (i / visual) * FLOOD_DURATION_MS },
      });
      edges.push({ id: `e-${i}`, source: masterId, target: id });
    }

    set({
      nodes: [master, ...swarm],
      edges,
      swarmSize: count,
    });
  },

  addStakeNode: ({ address, fundingSource, flagged, isReal }) => {
    set((s) => {
      if (s.nodes.some((n) => n.id === address)) return s;

      if (isReal) {
        return {
          ...s,
          nodes: [
            ...s.nodes,
            {
              id: address,
              type: "gt",
              position: { x: 150, y: 150 },
              data: { kind: "real" },
            },
          ],
        };
      }

      const idx = s.swarmSize;
      const newNodes = [...s.nodes];
      const newEdges = [...s.edges];

      if (fundingSource && !s.nodes.some((n) => n.id === fundingSource)) {
        newNodes.push({
          id: fundingSource,
          type: "gt",
          position: MASTER_POS,
          data: { kind: "master" },
        });
      }

      newNodes.push({
        id: address,
        type: "gt",
        position: ringPosition(idx, idx + 1),
        data: { kind: (flagged ? "flagged" : "unverified") as GraphNodeKind },
      });

      if (fundingSource) {
        newEdges.push({
          id: `e-${address}`,
          source: fundingSource,
          target: address,
        });
      }

      return {
        ...s,
        nodes: newNodes,
        edges: newEdges,
        swarmSize: s.swarmSize + 1,
      };
    });
  },

  flagAll: () => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.data.kind === "unverified"
          ? { ...n, data: { ...n.data, kind: "flagged" as GraphNodeKind } }
          : n
      ),
    }));
  },

  slashAll: () => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.data.kind === "flagged"
          ? { ...n, data: { ...n.data, kind: "slashed" as GraphNodeKind } }
          : n
      ),
    }));
  },

  reset: () => set({ nodes: [], edges: [], swarmSize: 0 }),
}));