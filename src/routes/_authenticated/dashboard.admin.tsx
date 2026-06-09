import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{ companies: number; uploads: number; insights: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (admin) {
        const [{ count: c }, { count: u }, { count: i }] = await Promise.all([
          supabase.from("companies").select("*", { count: "exact", head: true }),
          supabase.from("uploads").select("*", { count: "exact", head: true }),
          supabase.from("insights").select("*", { count: "exact", head: true }),
        ]);
        setStats({ companies: c ?? 0, uploads: u ?? 0, insights: i ?? 0 });
      }
    })();
  }, []);

  if (isAdmin === null) return <p className="text-sm text-muted-foreground">Checking permissions…</p>;
  if (!isAdmin) return (
    <Card className="p-10 text-center">
      <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 font-medium">Admins only</p>
      <p className="text-sm text-muted-foreground">Contact your workspace admin to request access.</p>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Platform-wide metrics and oversight.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { l: "Companies", v: stats?.companies ?? 0 },
          { l: "Uploads", v: stats?.uploads ?? 0 },
          { l: "Insights", v: stats?.insights ?? 0 },
        ].map((k) => (
          <Card key={k.l} className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.l}</div>
            <div className="mt-2 text-3xl font-semibold">{k.v}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}