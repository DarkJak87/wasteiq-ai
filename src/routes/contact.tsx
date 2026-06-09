import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — WasteIQ AI" },
    { name: "description", content: "Book a demo or get in touch with the WasteIQ AI team." },
    { property: "og:title", content: "Contact — WasteIQ AI" },
    { property: "og:description", content: "Talk to our team about your sustainability goals." },
  ] }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(1000),
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Let's talk</h1>
          <p className="mt-3 text-muted-foreground">Tell us about your business and we'll be in touch within one working day.</p>
        </div>
        <Card className="mt-10 border-border/60 bg-card p-6">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const parsed = schema.safeParse({
                name: fd.get("name"), email: fd.get("email"),
                company: fd.get("company"), message: fd.get("message"),
              });
              if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Please complete the form");
                return;
              }
              setSubmitting(true);
              setTimeout(() => {
                setSubmitting(false);
                toast.success("Thanks — we'll be in touch shortly.");
                (e.target as HTMLFormElement).reset();
              }, 600);
            }}
          >
            <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required maxLength={100} /></div>
            <div className="grid gap-2"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" required maxLength={255} /></div>
            <div className="grid gap-2"><Label htmlFor="company">Company</Label><Input id="company" name="company" maxLength={120} /></div>
            <div className="grid gap-2"><Label htmlFor="message">How can we help?</Label><Textarea id="message" name="message" required maxLength={1000} rows={5} /></div>
            <Button type="submit" disabled={submitting} className="bg-gradient-primary text-primary-foreground">{submitting ? "Sending…" : "Send message"}</Button>
          </form>
        </Card>
      </section>
    </MarketingShell>
  );
}