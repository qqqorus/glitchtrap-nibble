"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGraphStore } from "@/stores/graph";
import { useDefenseStore } from "@/stores/defense";

const TICK_MS = 200;
const MAX_SAMPLES = 60; // 12s rolling window
const WIDTH = 100;
const HEIGHT = 40;
const BASELINE_JITTER = 0.6; // keeps the idle line from looking dead/flat

export function ActivitySpike() {
  const nodeCount = useGraphStore((s) => s.nodes.length);
  const status = useDefenseStore((s) => s.status);
  const [samples, setSamples] = useState<number[]>([]);
  const lastCountRef = useRef(0);
  const nodeCountRef = useRef(0);
  nodeCountRef.current = nodeCount;

  useEffect(() => {
    if (nodeCount === 0) {
      setSamples([]);
      lastCountRef.current = 0;
    }
  }, [nodeCount === 0]);

  // continuous ticking sampler — this is what turns it into a real waveform
  // instead of a 2-point step. rate = new wallets since last tick + idle noise.
  useEffect(() => {
    const id = setInterval(() => {
      const delta = nodeCountRef.current - lastCountRef.current;
      lastCountRef.current = nodeCountRef.current;
      const noise = (Math.random() - 0.5) * BASELINE_JITTER;
      setSamples((prev) => {
        const next = [...prev, delta + noise];
        return next.length > MAX_SAMPLES ? next.slice(next.length - MAX_SAMPLES) : next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  if (samples.length < 2) {
    return <p className="text-[11px] text-text-faint font-mono py-4 text-center">Activity spike — no data yet.</p>;
  }

  const maxRate = Math.max(...samples.map((r) => Math.abs(r)), 3);
  const points = samples.map((r, i) => ({
    x: (i / (MAX_SAMPLES - 1)) * WIDTH,
    y: HEIGHT / 2 - (r / maxRate) * (HEIGHT / 2 - 3),
  }));
  const path = "M" + points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L");
  const last = points[points.length - 1];
  const color = status === "NORMAL" ? "var(--color-state-safe)" : "var(--color-state-danger)";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-text-faint">Activity Spike</p>
        <p className="text-[10px] font-mono text-text-muted">{nodeCount} wallets</p>
      </div>
      <div className="relative w-full h-16">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full" preserveAspectRatio="none">
          <line x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} stroke="var(--color-border-subtle)" strokeWidth={0.5} />
          <path d={path} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        {/* plain HTML dot, positioned by %, so it isn't squashed by preserveAspectRatio="none" */}
        <motion.span
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${(last.x / WIDTH) * 100}%`,
            top: `${(last.y / HEIGHT) * 100}%`,
            translateX: "-50%",
            translateY: "-50%",
            background: color,
          }}
          animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}