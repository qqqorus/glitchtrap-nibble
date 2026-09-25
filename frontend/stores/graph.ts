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
  flagAll: () => void;
  slashAll: () => void;
  reset: () => void;
};

const MASTER_POS = { x: 600, y: 400 };

function starPosition(i: number, total: number, radius: number) {
  const angle = (i / total) * Math.PI * 2;
  return {
    x: MASTER_POS.x + Math.cos(angle) * radius,
    y: MASTER_POS.y + Math.sin(angle) * radius,
  };
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  swarmSize: 0,

  addRealUser: (id) => {
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id,
          type: "gt",
          position: { x: 150, y: 150 },
          data: { kind: "real" },
        },
      ],
    }));
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
        position: starPosition(i, visual, 620),
        data: { kind: "unverified" },
      });
      edges.push({ id: `e-${i}`, source: masterId, target: id });
    }

    set({
      nodes: [master, ...swarm],
      edges,
      swarmSize: count,
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