import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: member } = await supabase
      .from("company_members").select("company_id, companies(name, industry, province)").eq("user_id", userId).limit(1).maybeSingle();

    const companyId = member?.company_id;
    if (!companyId) {
      return { company: null, kpis: empty(), insights: [], uploads: [], series: [] };
    }

    const [{ data: insights }, { data: uploads }] = await Promise.all([
      supabase.from("insights").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50),
      supabase.from("uploads").select("id, original_name, status, file_type, size_bytes, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(20),
    ]);

    const ins = insights ?? [];
    const totalWaste = ins.reduce((s, i) => s + Number(i.total_waste_kg ?? 0), 0);
    const recyclable = ins.length ? ins.reduce((s, i) => s + Number(i.recyclable_pct ?? 0), 0) / ins.length : 0;
    const savings = ins.reduce((s, i) => s + Number(i.estimated_savings_zar ?? 0), 0);
    const carbon = ins.reduce((s, i) => s + Number(i.carbon_kg ?? 0), 0);

    // Monthly series (last 6 months)
    const months: Record<string, { month: string; waste: number; recycled: number; landfill: number; savings: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { month: d.toLocaleString("en-ZA", { month: "short" }), waste: 0, recycled: 0, landfill: 0, savings: 0 };
    }
    for (const i of ins) {
      const d = new Date(i.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) continue;
      const w = Number(i.total_waste_kg ?? 0);
      const rPct = Number(i.recyclable_pct ?? 0) / 100;
      months[key].waste += w;
      months[key].recycled += w * rPct;
      months[key].landfill += w * (1 - rPct);
      months[key].savings += Number(i.estimated_savings_zar ?? 0);
    }

    // Aggregate classification
    const cls: Record<string, number> = { plastic: 0, glass: 0, paper: 0, metal: 0, organic: 0, general: 0 };
    for (const i of ins) {
      const c = (i.classification ?? {}) as Record<string, number>;
      for (const k of Object.keys(cls)) cls[k] += Number(c[k] ?? 0);
    }
    const clsTotal = Object.values(cls).reduce((a, b) => a + b, 0) || 1;
    const classification = Object.entries(cls).map(([name, v]) => ({ name, value: Math.round((v / clsTotal) * 100) }));

    return {
      company: member?.companies ?? null,
      kpis: {
        totalUploads: uploads?.length ?? 0,
        totalInsights: ins.length,
        totalWasteKg: totalWaste,
        recyclablePct: recyclable,
        savingsZar: savings,
        carbonKg: carbon,
      },
      insights: ins,
      uploads: uploads ?? [],
      series: Object.values(months),
      classification,
    };
  });

function empty() {
  return { totalUploads: 0, totalInsights: 0, totalWasteKg: 0, recyclablePct: 0, savingsZar: 0, carbonKg: 0 };
}
