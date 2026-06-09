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
      return { company: null, kpis: empty(), insights: [], uploads: [], series: [], classification: [], materials: [], mixDonut: [] };
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
    const recoverable = ins.reduce((s, i) => s + Number((i as any).recoverable_value_zar ?? 0), 0);
    const withCircular = ins.filter((i) => (i as any).circular_economy_score != null);
    const circular = withCircular.length ? withCircular.reduce((s, i) => s + Number((i as any).circular_economy_score), 0) / withCircular.length : 0;
    const withDiv = ins.filter((i) => (i as any).landfill_diversion_score != null);
    const diversion = withDiv.length ? withDiv.reduce((s, i) => s + Number((i as any).landfill_diversion_score), 0) / withDiv.length : recyclable;
    const eq = ins.reduce((acc, i) => {
      const e = ((i as any).equivalences ?? {}) as Record<string, number>;
      acc.trees += Number(e.trees_planted ?? 0);
      acc.km += Number(e.km_not_driven ?? 0);
      acc.bottles += Number(e.bottles_removed ?? 0);
      return acc;
    }, { trees: 0, km: 0, bottles: 0 });

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

    // Aggregate per-material breakdown
    const matAgg: Record<string, { name: string; weight_kg: number; value_zar: number; recyclable: boolean }> = {};
    for (const i of ins) {
      const mats = ((i as any).materials ?? []) as any[];
      for (const m of mats) {
        const name = String(m?.name ?? "General");
        const w = Number(m?.weight_kg ?? 0);
        const v = Number(m?.recoverable_value_zar ?? 0);
        if (!matAgg[name]) matAgg[name] = { name, weight_kg: 0, value_zar: 0, recyclable: Boolean(m?.recyclable) };
        matAgg[name].weight_kg += w;
        matAgg[name].value_zar += v;
        matAgg[name].recyclable = matAgg[name].recyclable || Boolean(m?.recyclable);
      }
    }
    const materials = Object.values(matAgg).sort((a, b) => b.weight_kg - a.weight_kg);

    const recyclableKg = totalWaste * (recyclable / 100);
    const mixDonut = [
      { name: "Recyclable", value: Math.round(recyclableKg * 10) / 10 },
      { name: "Landfill", value: Math.round((totalWaste - recyclableKg) * 10) / 10 },
    ];

    return {
      company: member?.companies ?? null,
      kpis: {
        totalUploads: uploads?.length ?? 0,
        totalInsights: ins.length,
        totalWasteKg: totalWaste,
        recyclablePct: recyclable,
        savingsZar: savings,
        carbonKg: carbon,
        circularScore: circular,
        diversionScore: diversion,
        recoverableValueZar: recoverable,
        recyclingPotentialPct: recyclable,
        trees: eq.trees,
        km: eq.km,
        bottles: eq.bottles,
      },
      insights: ins,
      uploads: uploads ?? [],
      series: Object.values(months),
      classification,
      materials,
      mixDonut,
    };
  });

function empty() {
  return { totalUploads: 0, totalInsights: 0, totalWasteKg: 0, recyclablePct: 0, savingsZar: 0, carbonKg: 0,
    circularScore: 0, diversionScore: 0, recoverableValueZar: 0, recyclingPotentialPct: 0, trees: 0, km: 0, bottles: 0 };
}
