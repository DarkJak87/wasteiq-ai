import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ uploadId: z.string().uuid() });

const SYS = `You are WasteIQ AI — a senior circular-economy consultant advising South African businesses.
Analyze the provided waste image or document like a sustainability auditor: estimate composition, weight, recyclability,
landfill diversion potential, carbon impact, recoverable material value (ZAR) and disposal cost savings.

Use realistic South African buy-back / recycler rates (R/kg, indicative):
PET R7, HDPE R5, Other Plastic R2, Cardboard R1.5, Paper R1.5, Glass R0.5, Aluminium R28, Other Metal R8, Organic R0, General R0.
Use realistic carbon avoidance factors (kg CO2e per kg recycled) ~ PET 2.5, HDPE 1.8, Cardboard 0.9, Paper 1.1, Glass 0.3, Aluminium 9.0, Metal 4.0, Organic 0.5.

Return STRICT JSON ONLY (no prose, no markdown fences) with this exact shape:
{
  "summary": string,
  "highlight": string,
  "total_waste_kg": number,
  "materials": [
    {
      "name": "PET" | "HDPE" | "Other Plastic" | "Cardboard" | "Paper" | "Glass" | "Aluminium" | "Other Metal" | "Organic" | "General",
      "weight_kg": number,
      "composition_pct": number,
      "recyclable": boolean,
      "confidence": number,
      "unit_value_zar_per_kg": number,
      "recoverable_value_zar": number
    }
  ],
  "recyclable_pct": number,
  "circular_economy_score": number,
  "landfill_diversion_score": number,
  "carbon_kg": number,
  "estimated_savings_zar": number,
  "recoverable_value_total_zar": number,
  "equivalences": { "trees_planted": number, "km_not_driven": number, "bottles_removed": number },
  "recommendations": string[]
}

Rules:
- composition_pct values across materials must sum to ~100.
- confidence is 0-100.
- circular_economy_score and landfill_diversion_score are 0-100 (Poor 0-30, Average 31-60, Good 61-80, Excellent 81-100).
- recommendations: 3-5 items, written as an SA sustainability consultant — quantify rand, kg or % impact, mention practical SA actions (separation at source, buy-back centres, composting, PETCO/Polyco streams, MRF partners). Do NOT just describe what you see.
- highlight is ONE short sentence naming the biggest opportunity (e.g. "Cardboard recycling could recover ~R450 and divert 35% of this stream from landfill.").
- estimated_savings_zar is an ANNUALISED disposal-cost saving if recommendations are adopted.
- Include only materials actually present (>0 kg).`;

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

    const materials = Array.isArray(p.materials) ? p.materials.map((m: any) => ({
      name: String(m?.name ?? "General"),
      weight_kg: num(m?.weight_kg),
      composition_pct: num(m?.composition_pct),
      recyclable: Boolean(m?.recyclable),
      confidence: clamp(num(m?.confidence), 0, 100),
      unit_value_zar_per_kg: num(m?.unit_value_zar_per_kg),
      recoverable_value_zar: num(m?.recoverable_value_zar),
    })) : [];

    // Build legacy classification map for back-compat
    const groups: Record<string, string[]> = {
      plastic: ["PET", "HDPE", "Other Plastic"],
      paper: ["Paper", "Cardboard"],
      glass: ["Glass"],
      metal: ["Aluminium", "Other Metal"],
      organic: ["Organic"],
      general: ["General"],
    };
    const classification: Record<string, number> = { plastic: 0, glass: 0, paper: 0, metal: 0, organic: 0, general: 0 };
    for (const [k, names] of Object.entries(groups)) {
      classification[k] = materials.filter((m) => names.includes(m.name)).reduce((s, m) => s + (m.composition_pct || 0), 0);
    }

    const recoverable_total = p.recoverable_value_total_zar != null
      ? num(p.recoverable_value_total_zar)
      : materials.reduce((s, m) => s + (m.recoverable_value_zar || 0), 0);

    const { error: insErr } = await supabase.from("insights").insert({
      upload_id: up.id,
      company_id: up.company_id,
      summary: p.summary ?? null,
      highlight: p.highlight ?? null,
      recommendations: Array.isArray(p.recommendations) ? p.recommendations : [],
      classification,
      materials,
      recyclable_pct: clamp(num(p.recyclable_pct), 0, 100),
      circular_economy_score: clamp(num(p.circular_economy_score), 0, 100),
      landfill_diversion_score: clamp(num(p.landfill_diversion_score), 0, 100),
      estimated_savings_zar: num(p.estimated_savings_zar),
      recoverable_value_zar: recoverable_total,
      carbon_kg: num(p.carbon_kg),
      total_waste_kg: num(p.total_waste_kg),
      equivalences: p.equivalences ?? {},
    });
    if (insErr) throw new Error(insErr.message);

    await supabase.from("uploads").update({ status: "processed", error: null }).eq("id", up.id);
    return { ok: true };
  });

function num(v: any): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
