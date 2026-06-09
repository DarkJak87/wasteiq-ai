import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — WasteIQ AI" },
    { name: "description", content: "Our mission is to enable every South African business to measure, optimise and reduce waste through AI." },
    { property: "og:title", content: "About — WasteIQ AI" },
    { property: "og:description", content: "A South African climate-tech company building the circular economy operating system." },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Building a circular South Africa</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          WasteIQ AI is a South African climate-tech company on a mission to enable every business —
          from restaurants to manufacturers — to measure, optimise and reduce waste through AI.
        </p>
        <p className="mt-4 text-muted-foreground">
          We believe the circular economy will be powered by software. By turning waste invoices,
          receipts and photos into actionable intelligence, we help SMEs cut disposal costs, raise
          recycling rates and unlock new tender and procurement opportunities.
        </p>
        <h2 className="mt-12 text-2xl font-semibold">Our values</h2>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>• Measurable impact, not greenwashing.</li>
          <li>• Built in and for South Africa.</li>
          <li>• Enterprise-grade quality for every size of business.</li>
        </ul>
      </section>
    </MarketingShell>
  );
}