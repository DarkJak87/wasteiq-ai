import { scoreBand } from "./RadialGauge";

export function ProgressGauge({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const band = scoreBand(v);
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-semibold tracking-tight">{v}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span></div>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: band.color + "1a", color: band.color }}>{band.label}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${v}%`, background: `linear-gradient(90deg, ${band.color}, #17B890)` }} />
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Poor</span><span>Average</span><span>Good</span><span>Excellent</span>
      </div>
      {label && <div className="mt-2 text-xs text-muted-foreground">{label}</div>}
    </div>
  );
}