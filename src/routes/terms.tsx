import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Terms of Service — WasteIQ AI" },
    { name: "description", content: "The terms governing your use of WasteIQ AI." },
  ] }),
  component: () => (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mt-6 text-muted-foreground">By using WasteIQ AI you agree to use the service in compliance with applicable South African laws and not to misuse the platform. AI-generated insights are estimates and should be reviewed before being used in regulated reporting.</p>
        <p className="mt-4 text-muted-foreground">Subscriptions renew monthly and can be cancelled at any time from your billing settings.</p>
      </section>
    </MarketingShell>
  ),
});