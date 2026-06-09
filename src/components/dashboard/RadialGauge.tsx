import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

export function scoreBand(score: number): { label: string; color: string } {
  if (score >= 81) return { label: "Excellent", color: "#009879" };
  if (score >= 61) return { label: "Good", color: "#17B890" };
  if (score >= 31) return { label: "Average", color: "#F59E0B" };
  return { label: "Poor", color: "#EF4444" };
}

export function RadialGauge({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const band = scoreBand(v);
  const data = [{ name: label, value: v, fill: band.color }];

  return (
    <div className="relative h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={210} endAngle={-30}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "rgba(0,152,121,0.08)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">{v}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">/ 100</div>
        <div className="mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: band.color + "1a", color: band.color }}>{band.label}</div>
        {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}