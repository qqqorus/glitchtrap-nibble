"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { GraphNodeData } from "@/lib/types";

const DOT_STYLES: Record<GraphNodeData["kind"], string> = {
  real: "bg-state-safe border-state-safe",
  unverified: "bg-text-faint border-border-strong",
  flagged: "bg-state-danger border-state-danger",
  master: "bg-state-danger border-state-danger",
  slashed: "bg-state-dead border-state-dead",
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
  const isEntrance = data.kind === "unverified" || data.kind === "real";

  return (
    <div title={data.label ?? data.kind}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <motion.div
        key={data.kind} // remounting on kind change gives flagged/slashed a quick "flash" transition for free
        className={cn("rounded-full border-2", DOT_STYLES[data.kind])}
        style={{ width: size, height: size }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{
          opacity: data.kind === "slashed" ? 0.25 : 1,
          scale: data.kind === "master" ? [1, 1.15, 1] : 1,
          boxShadow: glow ? `0 0 ${size}px ${glow}` : "0 0 0px transparent",
        }}
        transition={
          data.kind === "master"
            ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
            : { delay: isEntrance ? (data.delayMs ?? 0) / 1000 : 0, duration: 0.35, ease: "easeOut" }
        }
      />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}