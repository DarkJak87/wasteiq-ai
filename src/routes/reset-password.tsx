import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — WasteIQ AI" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <MarketingShell>
      <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <Card className="border-border/60 bg-card p-6 shadow-elegant">
          <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
          <form
            className="mt-6 grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const password = String(new FormData(e.currentTarget).get("password") ?? "");
              if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
              setLoading(true);
              const { error } = await supabase.auth.updateUser({ password });
              setLoading(false);
              if (error) { toast.error(error.message); return; }
              toast.success("Password updated.");
              navigate({ to: "/dashboard" });
            }}
          >
            <div className="grid gap-2"><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" required minLength={6} /></div>
            <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground">{loading ? "Updating…" : "Update password"}</Button>
          </form>
        </Card>
      </section>
    </MarketingShell>
  );
}