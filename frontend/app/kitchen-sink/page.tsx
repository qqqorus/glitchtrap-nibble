export default function KitchenSink() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="font-pixel text-[18px] text-brand-purple drop-shadow-[0_0_12px_rgba(168,85,247,0.55)]">
          GLITCHTRAP
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-text-muted">
          // benefits portal
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-bg-panel/85 backdrop-blur-md border border-border-subtle p-4">
          <p className="text-sm text-text-muted">Panel content here.</p>
        </div>
        <div className="rounded-lg bg-bg-panel/85 backdrop-blur-md border border-border-subtle p-4">
          <p className="text-sm text-text-muted">Graph goes here.</p>
        </div>
        <div className="rounded-lg bg-bg-panel/85 backdrop-blur-md border border-border-subtle p-4">
          <p className="text-sm text-text-muted">Alerts go here.</p>
        </div>
      </div>

      <div className="flex gap-6">
        <span className="font-pixel text-[11px] text-state-safe">● SYSTEM NORMAL</span>
        <span className="font-pixel text-[11px] text-state-danger">▲ UNDER ATTACK</span>
        <span className="font-pixel text-[11px] text-state-warn">◆ DEFENDED</span>
        <span className="font-pixel text-[11px] text-brand-purple">✕ SLASH EXECUTED</span>
      </div>
    </div>
  );
}