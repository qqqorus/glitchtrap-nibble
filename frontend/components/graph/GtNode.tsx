"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import type { GraphNodeData } from "@/lib/types";

const DOT_STYLES: Record<GraphNodeData["kind"], string> = {
  real: "bg-state-safe border-state-safe",
  unverified: "bg-text-faint border-border-strong",
  flagged: "bg-state-danger border-state-danger",
  master: "bg-state-danger border-state-danger animate-pulse",
  slashed: "bg-state-dead border-state-dead opacity-30",
};

const GLOW: Record<GraphNodeData["kind"], string | undefined> = {
  real: "var(--color-state-safe)",
  unverified: undefined,
  flagged: "var(--color-state-danger)",
  master: "var(--color-state-danger)",
  slashed: undefined,
};

type GtNodeProps = NodeProps & { data: GraphNodeData };

export function GtNode({ data }: GtNodeProps) {
  const size = data.kind === "master" ? 18 : 10;
  const glow = GLOW[data.kind];

  return (
    <div title={data.label ?? data.kind}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <div
        className={cn("rounded-full border-2", DOT_STYLES[data.kind])}
        style={{
          width: size,
          height: size,
          boxShadow: glow ? `0 0 ${size}px ${glow}` : undefined,
        }}
      />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}