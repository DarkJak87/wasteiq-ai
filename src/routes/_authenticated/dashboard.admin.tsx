import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { getAdminStats, getAdminStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{ companies: number; uploads: number; insights: number } | null>(null);
  const fnStatus = useServerFn(getAdminStatus);
  const fnStats = useServerFn(getAdminStats);

  useEffect(() => {
    (async () => {
      try {
        const { isAdmin: admin } = await fnStatus();
        setIsAdmin(admin);
        if (admin) {
          const s = await fnStats();
          setStats(s);
        }
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [fnStatus, fnStats]);

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