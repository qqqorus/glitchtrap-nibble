import { cn } from "@/lib/cn";

type PanelProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
};

export function Panel({ title, children, className, right }: PanelProps) {
  return (
    <section
      className={cn(
        "relative rounded-lg overflow-hidden flex flex-col",
        "bg-bg-panel/85 backdrop-blur-md",
        "border border-white/10",
        "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
        <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-text-muted">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {right}
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-state-danger/60" />
            <span className="w-2 h-2 rounded-full bg-state-warn/60" />
            <span className="w-2 h-2 rounded-full bg-state-safe/60" />
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">{children}</div>
    </section>
  );
}