import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  component: BillingPage,
});

const tiers = [
  { name: "Starter", price: "R299/mo", features: ["10 uploads / month", "Monthly report", "Email support"] },
  { name: "Growth", price: "R799/mo", popular: true, features: ["Unlimited uploads", "Advanced analytics", "Priority support"] },
  { name: "Enterprise", price: "Custom", features: ["Multiple sites", "Admin & API access", "Dedicated CSM"] },
];

function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">You're on the Starter trial. Upgrade anytime.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <Card key={t.name} className={`p-5 ${t.popular ? "ring-1 ring-primary/40" : ""}`}>
            <div className="text-sm text-muted-foreground">{t.name}</div>
            <div className="mt-2 text-3xl font-semibold">{t.price}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {t.features.map((f) => <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />{f}</li>)}
            </ul>
            <Button asChild className="mt-5 w-full" variant={t.popular ? "default" : "outline"}>
              <Link to="/pricing">Choose {t.name}</Link>
            </Button>
          </Card>
        ))}
      </div>
      <Card className="p-5 text-sm text-muted-foreground">
        Need an invoice or to manage payment methods? Email <a className="text-primary underline" href="mailto:billing@wasteiq.ai">billing@wasteiq.ai</a>.
      </Card>
    </div>
  );
}