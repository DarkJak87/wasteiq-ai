## WasteIQ AI — Phase 4: Report Accuracy & Consistency

Goal: every rand, kg CO₂e, recommendation and equivalence must come from deterministic code applied to the AI's material detection — not the model's free-form output. Reports gain a confidence score, methodology section and a cover banner. No UI redesign, no new pages.

---

### 1. Deterministic factor table (single source of truth)

New file `src/lib/waste-factors.ts` (shared by server + client). Exports:

```ts
WASTE_FACTORS = {
  "PET":            { value_per_kg: 7,  carbon_per_kg: 2.1, recyclable: true,  stream: "plastic" },
  "HDPE":           { value_per_kg: 5,  carbon_per_kg: 1.8, recyclable: true,  stream: "plastic" },
  "Other Plastic":  { value_per_kg: 2,  carbon_per_kg: 1.5, recyclable: true,  stream: "plastic" },
  "Cardboard":      { value_per_kg: 3,  carbon_per_kg: 0.7, recyclable: true,  stream: "paper"   },
  "Paper":          { value_per_kg: 2,  carbon_per_kg: 0.6, recyclable: true,  stream: "paper"   },
  "Glass":          { value_per_kg: 1,  carbon_per_kg: 0.3, recyclable: true,  stream: "glass"   },
  "Aluminium":      { value_per_kg: 25, carbon_per_kg: 1.8, recyclable: true,  stream: "metal"   },
  "Other Metal":    { value_per_kg: 8,  carbon_per_kg: 1.5, recyclable: true,  stream: "metal"   },
  "Organic":        { value_per_kg: 0,  carbon_per_kg: 0.5, recyclable: false, stream: "organic" },
  "General":        { value_per_kg: 0,  carbon_per_kg: 0,   recyclable: false, stream: "general" },
}
LANDFILL_COST_PER_KG_ZAR = 1.20  // SA avg gate fee, used for annual savings
```

Helpers: `computeMaterial(name, weight_kg)`, `computeEquivalences(carbonKg, divertedWeightKg)`, `buildRecommendations(materials[])`, `confidenceBand(score)`.

Equivalence formulas (rounded up to ≥1 when input > 0):
- trees_planted = `ceil(carbonKg / 21)`
- km_not_driven = `ceil(carbonKg / 0.18)`
- bottles_recycled = `ceil(divertedPlasticKg / 0.025)` (25 g PET bottle)

`buildRecommendations` is pure logic: for each detected material with weight > 0 it picks a templated SA consultant line ("Implement PET bottle recycling — ~R{value} recoverable at SA buy-back rates"). Adds contamination/general-waste lines, source-separation if 3+ streams present, composting if organic > 5%, etc. Never mentions an absent material.

### 2. AI prompt slimmed down

`src/lib/ai.functions.ts`: rewrite the system prompt so Gemini only returns:
- `total_waste_kg`, `materials: [{name, weight_kg, composition_pct, confidence}]`, `confidence_score` (0–100), `summary`, `highlight`.

Drop all $ / carbon / recommendations / equivalences from the schema. Server then:
1. Maps each material through `computeMaterial` → fills `recyclable`, `unit_value_zar_per_kg`, `recoverable_value_zar`, `carbon_kg`.
2. Sums totals deterministically.
3. Computes `circular_economy_score` = recyclable weight / total × 100, `landfill_diversion_score` = same, `recyclable_pct` = same.
4. `estimated_savings_zar` = `divertedKg * LANDFILL_COST_PER_KG_ZAR * 52` (weekly→annual) + `recoverable_value_total`.
5. Builds recommendations + equivalences via helpers.
6. Persists `confidence_score` in new column.

Highlight is derived in code from the largest-value recyclable material (with model fallback).

### 3. Migration

Add `confidence_score numeric` (nullable) to `public.insights`. Backfill existing rows = 75. GRANTs unchanged.

### 4. Dashboard data layer

`src/lib/dashboard.functions.ts`: add `confidenceScore` (avg of insights, ignoring nulls) and `confidenceBand` to `kpis`. Per-material carbon to `materials` aggregate so the table and PDF can display CO₂e per row.

### 5. UI surface (no redesign)

- `MaterialTable.tsx`: add "Carbon avoided" column showing `kg CO₂e`. Already has weight / % / recyclable / value.
- `dashboard.index.tsx`: replace the "AI Insights" KPI tile with an **AI Confidence** tile (`92% · High Confidence`, brand-green).
- `dashboard.insights.tsx`: per-insight confidence chip next to "AI Analysis" badge.
- Equivalence tiles: use the new helper so values never show 0 when carbon > 0.

### 6. PDF report (`dashboard.reports.tsx`)

Rewrite `downloadPDF` with structure:

1. **Cover** — full-width banner image + WasteIQ AI title, company, period, generated date.
2. Executive Summary
3. Key Metrics
4. Material Breakdown (Material · Weight · % · Recyclable · Value R · Carbon kg CO₂e)
5. Waste Composition
6. Recoverable Material Value (summary + per-material)
7. Carbon Impact (total + equivalences, never zero when carbon > 0)
8. Recommendations (deterministic list from `buildRecommendations`)
9. Future Improvement Opportunities
10. **Methodology** — fixed paragraph: "Material composition is estimated using AI image analysis. Carbon impacts and economic values are calculated using deterministic South African benchmark factors. Annual savings are based on avoided landfill disposal costs and material recovery opportunities. Results are directional estimates and should be validated through physical waste audits."
11. **Confidence Score** — large number + band, factor table footnote.

CSV gains `confidence_score`, per-material carbon JSON.

### 7. Banner asset

Generate `src/assets/report-banner.jpg` (1600×400 wide, brand green, abstract circular-economy motif). Embed in PDF as base64 on the cover page (jsPDF `addImage`).

---

### Technical notes

- All factors live in `waste-factors.ts` — single edit point.
- AI model still `google/gemini-2.5-flash`; lighter prompt = fewer hallucinations.
- Old insight rows (without `confidence_score`) fall back to 75 / "Medium".
- No new dependencies; banner asset shipped via Lovable Assets CDN.
- No auth, storage, or schema changes beyond the additive `confidence_score` column.

### Out of scope

UI redesign, new pages, IoT/marketplace/carbon credits, manual weight overrides, multi-period comparisons.
