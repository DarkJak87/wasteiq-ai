import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  WASTE_FACTORS,
  LANDFILL_COST_PER_KG_ZAR,
  ANNUALISATION_FACTOR,
  computeMaterial,
  computeEquivalences,
  buildRecommendations,
  buildHighlight,
  type ComputedMaterial,
} from "@/lib/waste-factors";

const Input = z.object({ uploadId: z.string().uuid() });

// The AI ONLY detects materials. All values, scores, savings, carbon and
// equivalences are computed deterministically server-side from waste-factors.ts.
const SYS = `You are WasteIQ AI — a vision auditor that identifies waste materials in an image or document.
Your ONLY job is to estimate the material composition. Do NOT invent prices, carbon values, recommendations or savings.

Return STRICT JSON ONLY (no prose, no markdown fences) with this exact shape:
{
  "summary": string,                  // 1-2 short sentences describing what you actually see
  "total_waste_kg": number,           // best estimate of total weight in kg (use 10 if unsure)
  "confidence_score": number,         // 0-100 overall detection confidence
  "materials": [
    {
      "name": "PET" | "HDPE" | "Other Plastic" | "Cardboard" | "Paper" | "Glass" | "Aluminium" | "Other Metal" | "Organic" | "General",
      "weight_kg": number,            // kg
      "composition_pct": number,      // 0-100, all materials must sum to ~100
      "confidence": number            // 0-100 per-material confidence
    }
  ]
}

Rules:
- ONLY include materials actually visible (weight_kg > 0).
- composition_pct across materials must sum to ~100.
- Use the closest matching name from the allowed list above.
- Do not output prices, ZAR values, recommendations, carbon, scores or equivalences — those are computed downstream.`;

export const analyzeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const { data: up, error: upErr } = await supabase
      .from("uploads").select("*").eq("id", data.uploadId).single();
    if (upErr || !up) throw new Error("Upload not found.");

    // Signed URL for the file
    const { data: signed, error: signErr } = await supabase
      .storage.from("waste-uploads").createSignedUrl(up.file_path, 600);
    if (signErr || !signed) throw new Error("Could not access file.");

    const isImage = up.file_type.startsWith("image/");
    const isPdf = up.file_type === "application/pdf";

    const userContent: any[] = [
      { type: "text", text: "Analyze this waste sample and respond with JSON only." },
    ];
    if (isImage) {
      userContent.push({ type: "image_url", image_url: { url: signed.signedUrl } });
    } else if (isPdf) {
      // Fetch and base64 the PDF
      const fileRes = await fetch(signed.signedUrl);
      const buf = new Uint8Array(await fileRes.arrayBuffer());
      let bin = ""; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      const b64 = btoa(bin);
      userContent.push({
        type: "file",
        file: { filename: up.original_name, file_data: `data:application/pdf;base64,${b64}` },
      });
    } else {
      userContent[0] = { type: "text", text: `Analyze a waste record named "${up.original_name}" and respond with JSON only.` };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      await supabase.from("uploads").update({ status: "failed", error: `AI ${res.status}` }).eq("id", up.id);
      console.error("[AI] gateway error", res.status, txt.slice(0, 500));
      if (res.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please top up in workspace settings.");
      throw new Error("Analysis failed. Please try again.");
    }
    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let p: any;
    try { p = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { p = {}; }

    // ---- Deterministic computation pipeline ----
    const detected: ComputedMaterial[] = Array.isArray(p.materials)
      ? p.materials
          .map((m: any) => computeMaterial(String(m?.name ?? "General"), num(m?.weight_kg), num(m?.composition_pct), num(m?.confidence)))
          .filter((m: ComputedMaterial) => m.weight_kg > 0)
      : [];

    // Merge duplicate names (model occasionally returns same material twice)
    const merged: Record<string, ComputedMaterial> = {};
    for (const m of detected) {
      if (!merged[m.name]) { merged[m.name] = { ...m }; }
      else {
        const e = merged[m.name];
        const w = e.weight_kg + m.weight_kg;
        e.weight_kg = Math.round(w * 10) / 10;
        e.composition_pct = Math.min(100, e.composition_pct + m.composition_pct);
        e.confidence = Math.round((e.confidence + m.confidence) / 2);
        e.recoverable_value_zar = Math.round(w * WASTE_FACTORS[e.name].value_per_kg);
        e.carbon_kg = Math.round(w * WASTE_FACTORS[e.name].carbon_per_kg * 10) / 10;
      }
    }
    const materials = Object.values(merged);

    const total_waste_kg = materials.reduce((s, m) => s + m.weight_kg, 0) || num(p.total_waste_kg);
    const recyclable_kg = materials.filter((m) => m.recyclable).reduce((s, m) => s + m.weight_kg, 0);
    const diverted_plastic_kg = materials.filter((m) => m.stream === "plastic").reduce((s, m) => s + m.weight_kg, 0);

    const recoverable_total = materials.reduce((s, m) => s + m.recoverable_value_zar, 0);
    const carbon_kg = Math.round(materials.reduce((s, m) => s + m.carbon_kg, 0) * 10) / 10;
    const recyclable_pct = total_waste_kg > 0 ? Math.round((recyclable_kg / total_waste_kg) * 100) : 0;
    const circular_economy_score = recyclable_pct;
    const landfill_diversion_score = recyclable_pct;
    const estimated_savings_zar = Math.round(recyclable_kg * LANDFILL_COST_PER_KG_ZAR * ANNUALISATION_FACTOR + recoverable_total);
    const equivalences = computeEquivalences(carbon_kg, diverted_plastic_kg);
    const recommendations = buildRecommendations(materials);
    const highlight = buildHighlight(materials) ?? (typeof p.highlight === "string" ? p.highlight : null);
    const confidence_score = clamp(num(p.confidence_score) || avgConfidence(materials), 0, 100);

    // Legacy classification map for back-compat with old charts
    const classification: Record<string, number> = { plastic: 0, glass: 0, paper: 0, metal: 0, organic: 0, general: 0 };
    for (const m of materials) classification[m.stream] += m.composition_pct;

    const { error: insErr } = await supabase.from("insights").insert({
      upload_id: up.id,
      company_id: up.company_id,
      summary: p.summary ?? null,
      highlight,
      recommendations,
      classification,
      materials,
      recyclable_pct,
      circular_economy_score,
      landfill_diversion_score,
      estimated_savings_zar,
      recoverable_value_zar: recoverable_total,
      carbon_kg,
      total_waste_kg: Math.round(total_waste_kg * 10) / 10,
      equivalences,
      confidence_score,
    });
    if (insErr) throw new Error(insErr.message);

    await supabase.from("uploads").update({ status: "processed", error: null }).eq("id", up.id);
    return { ok: true };
  });

function num(v: any): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function avgConfidence(materials: ComputedMaterial[]): number {
  if (!materials.length) return 0;
  return Math.round(materials.reduce((s, m) => s + m.confidence, 0) / materials.length);
}
