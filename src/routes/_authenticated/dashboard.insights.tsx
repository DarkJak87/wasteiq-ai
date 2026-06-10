import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/dashboard.functions";
import { Card } from "@/components/ui/card";
import { Sparkles, Recycle, Coins, Leaf, Lightbulb, Gauge, Banknote, TrendingUp } from "lucide-react";
import { MaterialTable, type MaterialRow } from "@/components/dashboard/MaterialTable";
import { InsightChip } from "@/components/dashboard/InsightChip";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { scoreBand } from "@/components/dashboard/RadialGauge";
import { confidenceBand } from "@/lib/waste-factors";

export const Route = createFileRoute("/_authenticated/dashboard/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  const fn = useServerFn(getDashboardData);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const k = data?.kpis;
  const topMaterial = (data?.materials ?? []).filter((m) => m.recyclable).sort((a, b) => b.value_zar - a.value_zar)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        <p className="text-sm text-muted-foreground">Consultant-grade analysis from each waste sample.</p>
      </div>

      {/* Insight chip strip */}
      {data?.insights?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InsightChip icon={Recycle} label="Recyclable share" value={`${(k?.recyclingPotentialPct ?? 0).toFixed(0)}% of this stream`} />
          <InsightChip icon={Coins} label="Potential annual savings" value={`R ${(k?.savingsZar ?? 0).toFixed(0)}`} tone="amber" />
          <InsightChip icon={Banknote} label="Material recovery value" value={`R ${(k?.recoverableValueZar ?? 0).toFixed(0)}`} />
          <InsightChip icon={TrendingUp} label="Highest opportunity" value={topMaterial ? `${topMaterial.name} recycling` : "Add more samples"} tone="rose" />
        </div>
      ) : null}

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        !data?.insights?.length ? (
          <Card className="p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-medium">No insights yet</p>
            <p className="text-sm text-muted-foreground">Upload your first waste image or invoice to generate insights.</p>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.insights.map((i: any) => {
              const materials = (i.materials ?? []) as MaterialRow[];
              const ce = Number(i.circular_economy_score ?? 0);
              const dv = Number(i.landfill_diversion_score ?? i.recyclable_pct ?? 0);
              const rec = Number(i.recoverable_value_zar ?? 0);
              const ceBand = scoreBand(ce);
              return (
                <Card key={i.id} className="p-5 backdrop-blur-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.65))]">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(i.created_at).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      {i.confidence_score != null && (() => {
                        const cb = confidenceBand(Number(i.confidence_score));
                        return (
                          <span
                            className="rounded-full px-2 py-0.5 font-medium"
                            style={{ background: `${cb.color}1a`, color: cb.color }}
                          >
                            {Math.round(Number(i.confidence_score))}% · {cb.label}
                          </span>
                        );
                      })()}
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">AI Analysis</span>
                    </div>
                  </div>
                  {i.highlight && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{i.highlight}</span>
                    </div>
                  )}
                  {i.summary && <p className="text-sm text-muted-foreground">{i.summary}</p>}

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Mini icon={Gauge} label="Circular" value={`${ce.toFixed(0)}`} sub={ceBand.label} color={ceBand.color} />
                    <Mini icon={Recycle} label="Diversion" value={`${dv.toFixed(0)}%`} />
                    <Mini icon={Banknote} label="Value" value={`R ${rec.toFixed(0)}`} />
                  </div>

                  {materials.length > 0 && (
                    <div className="mt-4">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Material breakdown</h3>
                      <MaterialTable rows={materials} />
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Annual savings</div>
                      <div className="text-sm font-semibold">R {Number(i.estimated_savings_zar ?? 0).toFixed(0)}</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Carbon avoided</div>
                      <div className="text-sm font-semibold">{Number(i.carbon_kg ?? 0).toFixed(1)} kg CO₂e</div>
                    </div>
                  </div>

                  {Array.isArray(i.recommendations) && i.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Leaf className="h-3 w-3" /> Consultant recommendations</h3>
                      <ol className="space-y-2 text-sm">
                        {(i.recommendations as string[]).slice(0, 5).map((r, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{idx + 1}</span>
                            <span className="text-muted-foreground">{r}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="mt-4">
                    <ProgressGauge value={dv} label="Landfill diversion potential" />
                  </div>
                </Card>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

function Mini({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/70 p-3 text-center backdrop-blur">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <div className="mt-1 text-base font-semibold" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}{sub ? ` · ${sub}` : ""}</div>
    </div>
  );
}