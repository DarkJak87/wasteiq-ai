import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [
    { title: "Pricing — WasteIQ AI" },
    { name: "description", content: "Starter R299, Growth R799, Enterprise custom. Simple, transparent pricing for South African businesses." },
    { property: "og:title", content: "Pricing — WasteIQ AI" },
    { property: "og:description", content: "Simple, transparent ZAR pricing." },
  ] }),
  component: PricingPage,
});

const tiers = [
  { name: "Starter", price: "R299", desc: "Perfect for small teams getting started.", features: ["10 uploads per month", "Monthly sustainability report", "Dashboard access", "Email support"] },
  { name: "Growth", price: "R799", popular: true, desc: "For SMEs serious about ESG performance.", features: ["Unlimited uploads", "Advanced analytics", "Unlimited reports", "AI recommendations", "Priority support"] },
  { name: "Enterprise", price: "Custom", desc: "Multi-site businesses & procurement leaders.", features: ["Multiple locations", "Admin dashboard", "API access", "Dedicated success manager", "SLA"] },
];

function PricingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Pricing in rands. No surprises.</h1>
          <p className="mt-3 text-muted-foreground">Cancel anytime. Upgrade as you grow.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {tiers.map((t) => (
            <Card key={t.name} className={`relative p-6 ${t.popular ? "border-primary/40 shadow-elegant ring-1 ring-primary/30" : "border-border/60"}`}>
              {t.popular && <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">Most popular</span>}
              <div className="text-sm text-muted-foreground">{t.name}</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight">{t.price}<span className="ml-1 text-base font-normal text-muted-foreground">{t.name === "Enterprise" ? "" : "/mo"}</span></div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {t.features.map((f) => (<li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>))}
              </ul>
              <Button asChild className={`mt-6 w-full ${t.popular ? "bg-gradient-primary text-primary-foreground" : ""}`} variant={t.popular ? "default" : "outline"}>
                <Link to="/auth">{t.name === "Enterprise" ? "Contact sales" : "Get started"}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}