import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/dashboard.functions";
import { Card } from "@/components/ui/card";
import { Sparkles, Recycle, Coins, Leaf } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  const fn = useServerFn(getDashboardData);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        <p className="text-sm text-muted-foreground">Recommendations and analysis from each waste sample.</p>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        !data?.insights?.length ? (
          <Card className="p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-medium">No insights yet</p>
            <p className="text-sm text-muted-foreground">Upload your first waste image or invoice to generate insights.</p>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.insights.map((i) => (
              <Card key={i.id} className="p-5">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(i.created_at).toLocaleString()}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Impact</span>
                </div>
                <p className="text-sm">{i.summary ?? "—"}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <Metric icon={Recycle} label="Recyclable" value={`${Number(i.recyclable_pct ?? 0).toFixed(0)}%`} />
                  <Metric icon={Coins} label="Savings" value={`R ${Number(i.estimated_savings_zar ?? 0).toFixed(0)}`} />
                  <Metric icon={Leaf} label="CO₂e" value={`${Number(i.carbon_kg ?? 0).toFixed(1)} kg`} />
                </div>
                {Array.isArray(i.recommendations) && i.recommendations.length > 0 && (
                  <ul className="mt-4 space-y-1 text-sm">
                    {(i.recommendations as string[]).slice(0, 5).map((r, idx) => (
                      <li key={idx} className="flex gap-2"><span className="text-primary">›</span>{r}</li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )
      }
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <div className="mt-1 text-sm font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}