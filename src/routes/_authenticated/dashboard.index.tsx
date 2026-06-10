import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/dashboard.functions";
import { Card } from "@/components/ui/card";
import { Recycle, Leaf, Coins, ShieldCheck, Trees, Car, Droplets, Banknote, Gauge } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RadialGauge } from "@/components/dashboard/RadialGauge";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { EquivalenceTile } from "@/components/dashboard/EquivalenceTile";
import { confidenceBand } from "@/lib/waste-factors";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

const MIX_COLORS = ["#009879", "#17B890", "#35D6A6", "#73F5C8", "#F59E0B", "#94A3B8"];
const DONUT_COLORS = ["#009879", "#CBD5E1"];

function Overview() {
  const fn = useServerFn(getDashboardData);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const k = data?.kpis;
  const fmt = (n?: number, d = 0) => (isLoading ? "—" : (n ?? 0).toFixed(d));
  const conf = k?.confidenceScore ?? 0;
  const cBand = confidenceBand(conf);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Your circular-economy performance at a glance.</p>
      </div>

      {/* Gauges row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 backdrop-blur-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.65))]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Circular Economy Score</h3>
            <Gauge className="h-4 w-4 text-primary" />
          </div>
          <RadialGauge value={k?.circularScore ?? 0} label="Circular" sub="Composite circularity" />
        </Card>
        <Card className="p-5 backdrop-blur-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.65))]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Landfill Diversion Score</h3>
            <Recycle className="h-4 w-4 text-primary" />
          </div>
          <ProgressGauge value={k?.diversionScore ?? 0} label="Share of waste kept out of landfill" />
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Recycling Potential</span><span>{fmt(k?.recyclingPotentialPct)}%</span></div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#17B890]" style={{ width: `${Math.min(100, k?.recyclingPotentialPct ?? 0)}%` }} />
            </div>
          </div>
        </Card>
        <Card className="p-5 backdrop-blur-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.65))]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Carbon Impact</h3>
            <Leaf className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-semibold tracking-tight">{fmt(k?.carbonKg)} <span className="text-sm font-normal text-muted-foreground">kg CO₂e avoided</span></div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <EquivalenceTile icon={Trees} label="Trees planted" value={fmt(k?.trees)} />
            <EquivalenceTile icon={Car} label="Km not driven" value={fmt(k?.km)} />
            <EquivalenceTile icon={Droplets} label="Bottles removed" value={fmt(k?.bottles)} />
          </div>
        </Card>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Waste Analyzed" value={`${fmt(k?.totalWasteKg)} kg`} icon={Recycle} sub={`${k?.totalInsights ?? 0} samples`} />
        <KpiCard label="Estimated Annual Savings" value={`R ${fmt(k?.savingsZar)}`} icon={Coins} sub="If recommendations applied" accent />
        <KpiCard label="Recoverable Material Value" value={`R ${fmt(k?.recoverableValueZar)}`} icon={Banknote} sub="Buy-back & recycler rates" />
        <KpiCard
          label="AI Confidence"
          value={`${conf}%`}
          icon={ShieldCheck}
          sub={`${cBand.label} confidence · ${k?.totalInsights ?? 0} samples`}
          accent
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 backdrop-blur-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.65))]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Waste trend</h2>
            <span className="text-xs text-muted-foreground">last 6 months · kg</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.series ?? []}>
                <defs>
                  <linearGradient id="rec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#009879" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#009879" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="landfill" stroke="#94A3B8" fill="url(#lan)" name="Landfill" />
                <Area type="monotone" dataKey="recycled" stroke="#009879" fill="url(#rec)" name="Recycled" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 backdrop-blur-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.65))]">
          <h2 className="mb-3 font-semibold">Recyclable vs Landfill</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.mixDonut ?? []} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {(data?.mixDonut ?? []).map((_, i) => (<Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v} kg`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 backdrop-blur-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.65))]">
          <h2 className="mb-3 font-semibold">Waste composition</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.classification ?? []} dataKey="value" nameKey="name" outerRadius={95}>
                  {(data?.classification ?? []).map((_, i) => (<Cell key={i} fill={MIX_COLORS[i % MIX_COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5 backdrop-blur-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.65))]">
          <h2 className="mb-3 font-semibold">Weight by material</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.materials ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)} kg`} />
                <Bar dataKey="weight_kg" name="Weight (kg)" fill="#009879" radius={[6,6,0,0]} />
              </BarChart>
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
