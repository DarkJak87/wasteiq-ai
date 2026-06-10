// Single source of truth for South African waste benchmark factors.
// All economic / carbon / equivalence math runs through here — never the AI.

export type StreamKey = "plastic" | "paper" | "glass" | "metal" | "organic" | "general";

export type MaterialName =
  | "PET" | "HDPE" | "Other Plastic"
  | "Cardboard" | "Paper"
  | "Glass"
  | "Aluminium" | "Other Metal"
  | "Organic" | "General";

export interface FactorRow {
  value_per_kg: number;       // ZAR / kg (SA buy-back / recycler benchmark)
  carbon_per_kg: number;      // kg CO2e avoided per kg recycled
  recyclable: boolean;
  stream: StreamKey;
}

export const WASTE_FACTORS: Record<MaterialName, FactorRow> = {
  "PET":           { value_per_kg: 7,  carbon_per_kg: 2.1, recyclable: true,  stream: "plastic" },
  "HDPE":          { value_per_kg: 5,  carbon_per_kg: 1.8, recyclable: true,  stream: "plastic" },
  "Other Plastic": { value_per_kg: 2,  carbon_per_kg: 1.5, recyclable: true,  stream: "plastic" },
  "Cardboard":     { value_per_kg: 3,  carbon_per_kg: 0.7, recyclable: true,  stream: "paper"   },
  "Paper":         { value_per_kg: 2,  carbon_per_kg: 0.6, recyclable: true,  stream: "paper"   },
  "Glass":         { value_per_kg: 1,  carbon_per_kg: 0.3, recyclable: true,  stream: "glass"   },
  "Aluminium":     { value_per_kg: 25, carbon_per_kg: 1.8, recyclable: true,  stream: "metal"   },
  "Other Metal":   { value_per_kg: 8,  carbon_per_kg: 1.5, recyclable: true,  stream: "metal"   },
  "Organic":       { value_per_kg: 0,  carbon_per_kg: 0.5, recyclable: false, stream: "organic" },
  "General":       { value_per_kg: 0,  carbon_per_kg: 0,   recyclable: false, stream: "general" },
};

// SA average gate fee per kg landfilled; used for annualised disposal savings.
export const LANDFILL_COST_PER_KG_ZAR = 1.20;
// Weekly sample → annualised
export const ANNUALISATION_FACTOR = 52;

export interface ComputedMaterial {
  name: MaterialName;
  weight_kg: number;
  composition_pct: number;
  recyclable: boolean;
  confidence: number;
  unit_value_zar_per_kg: number;
  recoverable_value_zar: number;
  carbon_kg: number;
  stream: StreamKey;
}

const ALIASES: Record<string, MaterialName> = {
  "pet": "PET", "pet bottles": "PET", "pet plastic": "PET", "plastic bottle": "PET", "plastic bottles": "PET",
  "hdpe": "HDPE", "hdpe plastic": "HDPE",
  "plastic": "Other Plastic", "other plastic": "Other Plastic", "mixed plastic": "Other Plastic",
  "cardboard": "Cardboard", "corrugated": "Cardboard", "carton": "Cardboard",
  "paper": "Paper", "office paper": "Paper", "newspaper": "Paper",
  "glass": "Glass", "glass bottle": "Glass", "glass bottles": "Glass",
  "aluminium": "Aluminium", "aluminum": "Aluminium", "can": "Aluminium", "cans": "Aluminium", "aluminium can": "Aluminium",
  "metal": "Other Metal", "other metal": "Other Metal", "steel": "Other Metal", "tin": "Other Metal",
  "organic": "Organic", "food": "Organic", "food waste": "Organic", "compost": "Organic", "organic waste": "Organic",
  "general": "General", "general waste": "General", "mixed": "General", "other": "General", "landfill": "General",
};

export function normaliseMaterialName(raw: string): MaterialName {
  const k = (raw ?? "").trim().toLowerCase();
  if (k in ALIASES) return ALIASES[k];
  // direct case match
  if ((WASTE_FACTORS as any)[raw]) return raw as MaterialName;
  // fuzzy
  for (const [alias, n] of Object.entries(ALIASES)) {
    if (k.includes(alias)) return n;
  }
  return "General";
}

export function computeMaterial(rawName: string, weight_kg: number, composition_pct: number, confidence: number): ComputedMaterial {
  const name = normaliseMaterialName(rawName);
  const f = WASTE_FACTORS[name];
  const w = Math.max(0, Number(weight_kg) || 0);
  return {
    name,
    weight_kg: round1(w),
    composition_pct: clamp(Number(composition_pct) || 0, 0, 100),
    recyclable: f.recyclable,
    confidence: clamp(Number(confidence) || 0, 0, 100),
    unit_value_zar_per_kg: f.value_per_kg,
    recoverable_value_zar: round0(w * f.value_per_kg),
    carbon_kg: round1(w * f.carbon_per_kg),
    stream: f.stream,
  };
}

export interface Equivalences {
  trees_planted: number;
  km_not_driven: number;
  bottles_recycled: number;
}

// Each formula returns at least 1 when its input is > 0 so reports never show zero.
export function computeEquivalences(carbonKg: number, divertedPlasticKg: number): Equivalences {
  const c = Math.max(0, carbonKg);
  const p = Math.max(0, divertedPlasticKg);
  return {
    trees_planted: c > 0 ? Math.max(1, Math.ceil(c / 21)) : 0,         // ~21 kg CO2/yr per mature tree
    km_not_driven: c > 0 ? Math.max(1, Math.ceil(c / 0.18)) : 0,       // ~180 g CO2 / km passenger car
    bottles_recycled: p > 0 ? Math.max(1, Math.ceil(p / 0.025)) : 0,    // 25 g per PET bottle
  };
}

export function confidenceBand(score: number): { label: "High" | "Medium" | "Low"; color: string } {
  if (score >= 90) return { label: "High",   color: "#009879" };
  if (score >= 70) return { label: "Medium", color: "#F59E0B" };
  return { label: "Low", color: "#EF4444" };
}

export function buildRecommendations(materials: ComputedMaterial[]): string[] {
  const present = materials.filter((m) => m.weight_kg > 0);
  if (!present.length) return ["Upload a clearer waste sample to generate material-specific recommendations."];

  const out: string[] = [];
  const streams = new Set(present.map((m) => m.stream));

  const byStream = (s: StreamKey) => present.filter((m) => m.stream === s);
  const sumStream = (s: StreamKey) => byStream(s).reduce((sum, m) => sum + m.weight_kg, 0);
  const valueStream = (s: StreamKey) => byStream(s).reduce((sum, m) => sum + m.recoverable_value_zar, 0);

  // Plastic
  if (streams.has("plastic")) {
    const pet = present.find((m) => m.name === "PET");
    if (pet && pet.weight_kg > 0) {
      out.push(`Implement PET bottle recycling — capture ~R${pet.recoverable_value_zar} through PETCO-registered buy-back centres.`);
    }
    const hdpe = present.find((m) => m.name === "HDPE");
    if (hdpe && hdpe.weight_kg > 0) {
      out.push(`Separate HDPE containers (milk, detergent) for collection — Polyco offtake yields ~R${hdpe.recoverable_value_zar}.`);
    }
    const oth = present.find((m) => m.name === "Other Plastic");
    if (oth && oth.weight_kg > 0 && !pet && !hdpe) {
      out.push(`Sort mixed plastics by resin code to unlock ~R${oth.recoverable_value_zar} via mixed-plastic recyclers.`);
    }
  }

  // Paper / Cardboard
  if (streams.has("paper")) {
    const cb = present.find((m) => m.name === "Cardboard");
    const pp = present.find((m) => m.name === "Paper");
    if (cb && pp) {
      out.push(`Separate paper and cardboard streams — combined recovery value ~R${valueStream("paper")} (Mpact/Sappi offtake).`);
    } else if (cb) {
      out.push(`Flatten and bale cardboard for collection — Mpact pays ~R${cb.recoverable_value_zar} for this volume.`);
    } else if (pp) {
      out.push(`Set up a dedicated white-paper bin near printers — Sappi ReFibre offtake recovers ~R${pp.recoverable_value_zar}.`);
    }
  }

  // Metal
  if (streams.has("metal")) {
    out.push(`Introduce a dedicated metal collection point — aluminium and steel together recover ~R${valueStream("metal")} (Collect-a-Can network).`);
  }

  // Glass
  if (streams.has("glass")) {
    out.push(`Add a glass-only bin and partner with The Glass Recycling Company — ~R${valueStream("glass")} recoverable plus closed-loop reuse.`);
  }

  // Organic
  const organic = present.find((m) => m.name === "Organic");
  if (organic && organic.composition_pct > 5) {
    out.push(`Divert ${organic.weight_kg} kg of organic waste to on-site composting or a Wormcity partner to remove it from landfill entirely.`);
  }

  // General waste contamination
  const general = present.find((m) => m.name === "General");
  if (general && general.composition_pct > 10) {
    out.push(`Reduce contamination in the general-waste stream (${general.composition_pct.toFixed(0)}%) with clearly labelled bins and a 5-minute weekly staff briefing.`);
  }

  // Multi-stream source separation
  if (streams.size >= 3 && !out.some((r) => r.toLowerCase().includes("source separation"))) {
    out.push(`Roll out source separation at the point of waste generation — ${streams.size} distinct recyclable streams identified justifies colour-coded bins.`);
  }

  return out.slice(0, 6);
}

export function buildHighlight(materials: ComputedMaterial[]): string | null {
  const recyclable = materials.filter((m) => m.recyclable && m.weight_kg > 0).sort((a, b) => b.recoverable_value_zar - a.recoverable_value_zar);
  const top = recyclable[0];
  if (!top) return null;
  return `${top.name} recycling could recover ~R${top.recoverable_value_zar} and divert ${top.composition_pct.toFixed(0)}% of this stream from landfill.`;
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function round0(n: number): number { return Math.round(n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }