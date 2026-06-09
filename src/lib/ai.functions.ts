import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ uploadId: z.string().uuid() });

const SYS = `You are WasteIQ AI, an expert circular-economy analyst for South African businesses.
Analyze the provided waste image or document and return STRICT JSON ONLY (no prose, no markdown fences) with this exact shape:
{
  "summary": string,
  "recommendations": string[],
  "classification": { "plastic": number, "glass": number, "paper": number, "metal": number, "organic": number, "general": number },
  "recyclable_pct": number,
  "estimated_savings_zar": number,
  "carbon_kg": number,
  "total_waste_kg": number
}
Classification values are percentages (0-100) and should sum to ~100. Use realistic SA waste-collection benchmarks for cost (R/kg) and carbon (kg CO2e/kg).`;

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
    let parsed: any;
    try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; }
    catch { parsed = { summary: String(raw).slice(0, 500), recommendations: [], classification: {}, recyclable_pct: 0, estimated_savings_zar: 0, carbon_kg: 0, total_waste_kg: 0 }; }

    const { error: insErr } = await supabase.from("insights").insert({
      upload_id: up.id,
      company_id: up.company_id,
      summary: parsed.summary ?? null,
      recommendations: parsed.recommendations ?? [],
      classification: parsed.classification ?? {},
      recyclable_pct: Number(parsed.recyclable_pct ?? 0),
      estimated_savings_zar: Number(parsed.estimated_savings_zar ?? 0),
      carbon_kg: Number(parsed.carbon_kg ?? 0),
      total_waste_kg: Number(parsed.total_waste_kg ?? 0),
    });
    if (insErr) throw new Error(insErr.message);

    await supabase.from("uploads").update({ status: "processed", error: null }).eq("id", up.id);
    return { ok: true };
  });
