import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  ArrowRight, Brain, BarChart3, Recycle, Leaf, Gauge, PiggyBank, ShieldCheck, Sparkles,
  CheckCircle2, Upload, FileSearch, LineChart, Sprout,
} from "lucide-react";
import heroFacility from "@/assets/hero-facility.jpg";
import teamDashboard from "@/assets/team-dashboard.jpg";
import materialsFlatlay from "@/assets/materials-flatlay.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WasteIQ AI — AI-Powered Waste Intelligence for SA Businesses" },
      { name: "description", content: "Reduce landfill waste, uncover recycling opportunities, lower disposal costs, and automatically generate ESG-grade sustainability reports." },
      { property: "og:title", content: "WasteIQ AI — Transform Waste Into Actionable Intelligence" },
      { property: "og:description", content: "AI-powered circular economy platform for South African businesses." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MarketingShell>
      <Hero />
      <FacilityBanner />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <CTA />
    </MarketingShell>
  );
}

function FacilityBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl shadow-elegant ring-1 ring-border/60 md:grid-cols-2">
        <div className="relative order-2 flex flex-col justify-center bg-card p-8 md:order-1 md:p-12">
          <p className="text-xs uppercase tracking-widest text-primary">From waste stream to value stream</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
            Every kilogram measured. <span className="gradient-text">Every rand recovered.</span>
          </h3>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            We see what your collectors see — and turn it into ESG outcomes your board can audit.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border/60 pt-6">
            <div>
              <div className="text-xl font-semibold text-foreground md:text-2xl">98%</div>
              <div className="text-xs text-muted-foreground">Stream accuracy</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-foreground md:text-2xl">R2.4M</div>
              <div className="text-xs text-muted-foreground">Avg. savings / yr</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-foreground md:text-2xl">42%</div>
              <div className="text-xs text-muted-foreground">Less to landfill</div>
            </div>
          </div>
        </div>
        <div className="relative order-1 min-h-[260px] md:order-2 md:min-h-[420px]">
          <img
            src={heroFacility}
            alt="Workers sorting recyclable waste streams at a modern South African recycling facility"
            width={1600}
            height={1100}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-hero animate-gradient absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            New: Multimodal AI analysis for waste invoices & photos
          </div>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            AI-Powered Waste Intelligence{" "}
            <span className="gradient-text">for South African Businesses</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Reduce landfill waste, uncover recycling opportunities, lower disposal costs, and automatically generate
            investor- and tender-ready sustainability reports.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
              <Link to="/auth">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Book a demo</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />No credit card required</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />ESG & GCIP-ready</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />POPIA compliant</span>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <HeroDashboardMock />
        </div>
      </div>
    </section>
  );
}

function HeroDashboardMock() {
  return (
    <div className="glass rounded-3xl p-3 shadow-elegant animate-float">
      <div className="rounded-2xl bg-card p-6 ring-1 ring-border/60">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <div className="text-xs text-muted-foreground">app.wasteiq.ai/dashboard</div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { label: "Total waste", value: "12.4t", delta: "-8.2%", icon: Recycle },
            { label: "Recyclable", value: "63%", delta: "+5.1%", icon: Leaf },
            { label: "CO₂ saved", value: "2.1t", delta: "+11%", icon: Sprout },
            { label: "Monthly cost", value: "R 18,420", delta: "-12%", icon: PiggyBank },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border/60 bg-gradient-card p-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs">{k.label}</span>
                <k.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</div>
              <div className="text-xs text-primary">{k.delta} vs last mo.</div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Waste diversion trend</span>
              <span className="text-xs text-muted-foreground">Last 6 months</span>
            </div>
            <FauxAreaChart />
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-3 text-sm font-medium">Composition</div>
            <FauxDonut />
          </div>
        </div>
      </div>
    </div>
  );
}

function FauxAreaChart() {
  const points = [30, 42, 38, 55, 60, 72, 78];
  const max = 100;
  const w = 600, h = 140;
  const step = w / (points.length - 1);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g1)" />
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function FauxDonut() {
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 36 36" className="h-24 w-24">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--muted)" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--primary)" strokeWidth="3.5"
          strokeDasharray="63 100" strokeDashoffset="25" strokeLinecap="round" transform="rotate(-90 18 18)" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--accent)" strokeWidth="3.5"
          strokeDasharray="22 100" strokeDashoffset="-38" strokeLinecap="round" transform="rotate(-90 18 18)" />
      </svg>
      <ul className="space-y-1 text-xs">
        <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />Paper 38%</li>
        <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" />Plastic 22%</li>
        <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted-foreground/50" />Other 40%</li>
      </ul>
    </div>
  );
}

function LogoStrip() {
  const items = ["Manufacturing", "Restaurants", "Warehouses", "Property Mgmt", "Retail", "Schools", "Hotels"];
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 sm:px-6 lg:px-8">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Built for</span>
        {items.map((i) => (
          <span key={i} className="text-sm font-medium text-muted-foreground/80">{i}</span>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Brain, title: "AI Waste Analysis", desc: "Multimodal AI reads invoices, receipts and photos to classify waste streams instantly." },
  { icon: BarChart3, title: "Sustainability Reports", desc: "ESG-grade PDF reports generated automatically for tenders, investors and procurement." },
  { icon: Recycle, title: "Recycling Insights", desc: "Identify materials currently sent to landfill that could be diverted and monetised." },
  { icon: Leaf, title: "Carbon Impact Tracking", desc: "Estimate CO₂e reductions per waste stream with transparent calculations." },
  { icon: Gauge, title: "Circular Economy Score", desc: "A single benchmarkable score that tracks your circular performance over time." },
  { icon: PiggyBank, title: "Cost-Saving Recommendations", desc: "AI suggests collector renegotiations, route changes and material recovery wins." },
  { icon: ShieldCheck, title: "ESG Readiness", desc: "Mapped to SA standards and global frameworks — ready for assurance." },
  { icon: LineChart, title: "Waste Diversion Analytics", desc: "Beautiful, interactive analytics from a single upload onwards." },
];

function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">An operating system for circular waste</h2>
        <p className="mt-4 text-muted-foreground">
          Every tool a sustainability lead needs — from upload to ESG-ready report — in one premium product.
        </p>
      </div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title} className="group relative overflow-hidden border-border/60 bg-gradient-card p-5 transition hover:shadow-elegant">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Upload, title: "Upload", desc: "Drop in waste invoices, collection receipts or photos." },
    { icon: Brain, title: "AI analyses", desc: "Gemini-powered multimodal AI classifies and quantifies." },
    { icon: FileSearch, title: "Insights", desc: "Get prioritised recommendations & savings estimates." },
    { icon: LineChart, title: "Track impact", desc: "Watch your circular score climb month over month." },
  ];
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl shadow-elegant ring-1 ring-border/60">
            <img
              src={teamDashboard}
              alt="Two sustainability leads reviewing a WasteIQ AI dashboard on a tablet"
              width={1400}
              height={1000}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">From bin to boardroom in 4 steps</h2>
            <p className="mt-3 text-muted-foreground">
              Built for sustainability teams who'd rather act than build spreadsheets.
            </p>
            <ol className="mt-8 space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-xl border border-border/60 bg-card p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{s.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    ["Up to 30%", "reduction in waste costs"],
    ["2.5×", "higher recycling rates"],
    ["−45%", "landfill dependency"],
    ["ESG-ready", "for procurement & tenders"],
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([v, l]) => (
          <Card key={l} className="border-border/60 bg-gradient-card p-6">
            <div className="text-3xl font-semibold tracking-tight gradient-text">{v}</div>
            <div className="mt-1 text-sm text-muted-foreground">{l}</div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const ts = [
    { q: "WasteIQ turned a confusing invoice trail into a clear cost-saving roadmap.", n: "Lerato M.", r: "Restaurant Owner, Sandton" },
    { q: "Our tenants love seeing the live diversion score. ESG conversations got easy.", n: "David P.", r: "Property Manager, Cape Town" },
    { q: "We diverted 38% of our packaging waste within two months.", n: "Sipho N.", r: "Warehouse Operator, Durban" },
    { q: "Finally, a tool that makes circular economy practical for SMEs.", n: "Ayesha K.", r: "Manufacturing SME, Gqeberha" },
  ];
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Loved by sustainability leaders</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {ts.map((t) => (
            <Card key={t.n} className="border-border/60 bg-card p-5">
              <p className="text-sm text-foreground">“{t.q}”</p>
              <div className="mt-4 text-sm">
                <div className="font-medium">{t.n}</div>
                <div className="text-muted-foreground">{t.r}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  const tiers = [
    { name: "Starter", price: "R299", desc: "Perfect for small teams getting started.", features: ["10 uploads / month", "Monthly report", "Dashboard access"] },
    { name: "Growth", price: "R799", popular: true, desc: "For SMEs serious about ESG performance.", features: ["Unlimited uploads", "Advanced analytics", "Unlimited reports", "AI recommendations"] },
    { name: "Enterprise", price: "Custom", desc: "Multi-site businesses & procurement leaders.", features: ["Multiple locations", "Admin dashboard", "API access", "Dedicated support"] },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade when you're ready.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {tiers.map((t) => (
          <Card key={t.name} className={`relative p-6 ${t.popular ? "border-primary/40 shadow-elegant ring-1 ring-primary/30" : "border-border/60"}`}>
            {t.popular && <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">Most popular</span>}
            <div className="text-sm text-muted-foreground">{t.name}</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight">{t.price}<span className="ml-1 text-base font-normal text-muted-foreground">{t.name === "Enterprise" ? "" : "/mo"}</span></div>
            <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>
              ))}
            </ul>
            <Button asChild className={`mt-6 w-full ${t.popular ? "bg-gradient-primary text-primary-foreground" : ""}`} variant={t.popular ? "default" : "outline"}>
              <Link to="/auth">{t.name === "Enterprise" ? "Contact sales" : "Get started"}</Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card p-10 text-center shadow-elegant">
        <img
          src={materialsFlatlay}
          alt="Flat-lay of sorted recyclable plastic bottles, cardboard and aluminium cans"
          width={1600}
          height={900}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
          loading="lazy"
        />
        <div className="bg-hero animate-gradient absolute inset-0 -z-10 opacity-50" />
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Turn your waste into a competitive edge</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Join South African leaders building a circular economy with AI.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-elegant">
            <Link to="/auth">Start free trial</Link>
          </Button>
          <Button asChild size="lg" variant="outline"><Link to="/contact">Book a demo</Link></Button>
        </div>
      </div>
    </section>
  );
}
