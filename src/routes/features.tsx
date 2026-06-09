import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, BarChart3, Recycle, Leaf, Gauge, PiggyBank, ShieldCheck, LineChart } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({ meta: [
    { title: "Features — WasteIQ AI" },
    { name: "description", content: "AI waste analysis, sustainability reports, recycling insights, carbon tracking, circular economy score and more." },
    { property: "og:title", content: "Features — WasteIQ AI" },
    { property: "og:description", content: "Everything a sustainability lead needs in one premium product." },
  ] }),
  component: FeaturesPage,
});

const F = [
  { icon: Brain, title: "AI Waste Analysis", desc: "Multimodal AI reads waste invoices, receipts and photos and classifies streams instantly." },
  { icon: BarChart3, title: "Sustainability Reports", desc: "ESG-grade PDF reports auto-generated for tenders, investors and procurement teams." },
  { icon: Recycle, title: "Recycling Insights", desc: "Discover materials going to landfill that could be recovered, reused or sold." },
  { icon: Leaf, title: "Carbon Impact Tracking", desc: "Transparent CO₂e estimates per stream, with monthly trend reporting." },
  { icon: Gauge, title: "Circular Economy Score", desc: "A single benchmarkable score tracking your circular performance." },
  { icon: PiggyBank, title: "Cost-Saving Recommendations", desc: "Renegotiate collector contracts and unlock material recovery wins." },
  { icon: ShieldCheck, title: "ESG Readiness", desc: "Aligned to SA standards and global frameworks, assurance ready." },
  { icon: LineChart, title: "Waste Diversion Analytics", desc: "Interactive analytics powered by your real upload data." },
];

function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Features built for circular leaders</h1>
          <p className="mt-4 text-muted-foreground">Every tool you need to measure, optimise and report on waste.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {F.map((f) => (
            <Card key={f.title} className="border-border/60 bg-gradient-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-elegant">
            <Link to="/auth">Start free trial</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  );
}