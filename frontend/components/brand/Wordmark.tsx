import { cn } from "@/lib/cn";

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-4", className)}>
      <span
        className={cn(
          "text-[26px] tracking-[0.02em] leading-none",
          "text-brand-purple",
          "drop-shadow-[0_0_6px_rgba(168,85,247,0.9)]",
          "drop-shadow-[0_0_20px_rgba(168,85,247,0.55)]"
        )}
        style={{
          fontFamily: "var(--font-rubik-glitch), sans-serif",
        }}
      >
        GLITCHTRAP
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] text-text-muted pb-[3px]">
        Benefits Portal
      </span>
    </div>
  );
}