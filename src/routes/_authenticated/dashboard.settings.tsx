import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [province, setProvince] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: m } = await supabase.from("company_members").select("company_id, companies(name, industry, province)").eq("user_id", user.id).limit(1).maybeSingle();
      if (m?.company_id) {
        setCompanyId(m.company_id);
        const c: any = m.companies;
        setName(c?.name ?? ""); setIndustry(c?.industry ?? ""); setProvince(c?.province ?? "");
      }
    })();
  }, []);

  async function save() {
    if (!companyId) return;
    const { error } = await supabase.from("companies").update({ name, industry, province }).eq("id", companyId);
    if (error) toast.error(error.message); else toast.success("Saved");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your company profile.</p>
      </div>
      <Card className="max-w-2xl space-y-4 p-6">
        <div><Label>Email</Label><Input value={email} disabled className="mt-1" /></div>
        <div><Label>Company name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Industry</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1" placeholder="Hospitality, Retail…" /></div>
          <div><Label>Province</Label><Input value={province} onChange={(e) => setProvince(e.target.value)} className="mt-1" placeholder="Gauteng" /></div>
        </div>
        <Button onClick={save}>Save changes</Button>
      </Card>
    </div>
  );
}