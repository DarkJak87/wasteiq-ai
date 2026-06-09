import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy — WasteIQ AI" },
    { name: "description", content: "How WasteIQ AI collects, uses and protects your data under POPIA." },
  ] }),
  component: () => (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 prose prose-neutral">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mt-6 text-muted-foreground">WasteIQ AI respects your privacy and complies with the Protection of Personal Information Act (POPIA). We collect only the data needed to provide our service: account details, uploaded waste documents, and usage analytics.</p>
        <h2 className="mt-8 text-2xl font-semibold">Your data</h2>
        <p className="mt-2 text-muted-foreground">Uploaded files are stored privately and used solely to generate insights for your business. You can request deletion of your data at any time by contacting us.</p>
        <h2 className="mt-8 text-2xl font-semibold">Contact</h2>
        <p className="mt-2 text-muted-foreground">For privacy enquiries, email privacy@wasteiq.ai.</p>
      </section>
    </MarketingShell>
  ),
});