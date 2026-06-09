import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/dashboard.functions";
import { Card } from "@/components/ui/card";
import { Recycle, Leaf, Coins, Upload as UploadIcon, Sparkles, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

const COLORS = ["#0F766E", "#84CC16", "#14532D", "#22D3EE", "#F59E0B", "#94A3B8"];

function Overview() {
  const fn = useServerFn(getDashboardData);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const k = data?.kpis;
  const kpis = [
    { label: "Total Uploads", value: k?.totalUploads ?? 0, icon: UploadIcon },
    { label: "AI Insights", value: k?.totalInsights ?? 0, icon: Sparkles },
    { label: "Waste Analyzed", value: `${(k?.totalWasteKg ?? 0).toFixed(0)} kg`, icon: Recycle },
    { label: "Recyclable", value: `${(k?.recyclablePct ?? 0).toFixed(0)}%`, icon: Leaf },
    { label: "Est. Savings", value: `R ${(k?.savingsZar ?? 0).toFixed(0)}`, icon: Coins },
    { label: "Carbon Avoided", value: `${(k?.carbonKg ?? 0).toFixed(0)} kg`, icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Your circular-economy performance at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{isLoading ? "—" : kpi.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Waste trend (last 6 months)</h2>
            <span className="text-xs text-muted-foreground">kg</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.series ?? []}>
                <defs>
                  <linearGradient id="rec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84CC16" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#84CC16" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="landfill" stroke="#84CC16" fill="url(#lan)" name="Landfill" />
                <Area type="monotone" dataKey="recycled" stroke="#0F766E" fill="url(#rec)" name="Recycled" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Waste mix</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.classification ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {(data?.classification ?? []).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Recent uploads</h2>
        {(!data?.uploads || data.uploads.length === 0) ? (
          <p className="text-sm text-muted-foreground">No uploads yet. Head to the Uploads page to add your first waste image or report.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {data.uploads.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{u.original_name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "processed" ? "bg-primary/10 text-primary" : u.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
