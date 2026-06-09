## WasteIQ AI — Phase 2 Intelligence Upgrade

Scope: deepen analysis + dashboards on the existing pages (Overview, Insights, Analytics, Reports). No new routes, no IoT/marketplace, no redesign — only KPI cards, gauges, charts, and a smarter AI pipeline.

---

### 1. Smarter AI analysis (`src/lib/ai.functions.ts`)

Replace the current prompt + JSON schema with a sustainability-consultant prompt that returns a richer structure:

```ts
{
  total_waste_kg: number,
  materials: [{
    name: "PET" | "HDPE" | "Other Plastic" | "Cardboard" | "Paper" |
          "Glass" | "Aluminium" | "Other Metal" | "Organic" | "General",
    weight_kg: number,
    composition_pct: number,   // 0–100, all sum ≈ 100
    recyclable: boolean,
    confidence: number,        // 0–100
    unit_value_zar_per_kg: number,
    recoverable_value_zar: number
  }],
  recyclable_pct: number,                 // landfill diversion potential
  circular_economy_score: number,         // 0–100
  landfill_diversion_score: number,       // 0–100
  carbon_kg: number,                      // kg CO2e avoided
  estimated_savings_zar: number,          // annualised disposal savings
  recoverable_value_total_zar: number,
  equivalences: { trees_planted: number, km_not_driven: number, bottles_removed: number },
  recommendations: string[],              // consultant-tone, SA context
  highlight: string                       // single "biggest opportunity" line
}
```

Prompt rewrite tells the model to act as an SA circular-economy consultant, use realistic SA buy-back rates (PET ~R7/kg, HDPE ~R5, cardboard ~R1.5, aluminium ~R28, glass ~R0.5, paper ~R1.5), and write recommendations that quantify rand/kg/% impact (not "plastic bottles detected").

Keep `materials` as a new column on `insights`; aggregate the legacy `classification` map server-side for backward compatibility so old rows still render.

### 2. Database migration

Add to `public.insights` (nullable, so old rows keep working):

- `materials jsonb default '[]'`
- `circular_economy_score numeric`
- `landfill_diversion_score numeric`
- `recoverable_value_zar numeric`
- `equivalences jsonb default '{}'`
- `highlight text`

GRANTs already cover the table; no policy changes needed.

### 3. Dashboard data layer (`src/lib/dashboard.functions.ts`)

Extend the aggregator to compute and return:

- `kpis`: add `circularScore` (avg), `diversionScore` (avg), `recoverableValueZar` (sum), `recyclingPotentialPct` (= recyclablePct), plus equivalence totals (trees/km/bottles).
- `materials`: array of `{ name, weight_kg, value_zar, recyclable }` summed across insights — feeds the bar chart, pie chart, value section.
- `mixDonut`: `[{name:"Recyclable", value}, {name:"Landfill", value}]`.
- Keep existing `series` and `classification` for back-compat.

### 4. Overview redesign (same page, richer content) — `dashboard.index.tsx`

KPI grid expanded to 7 premium cards (glassmorphism, large numbers, brand greens):
Total Waste Analyzed · Circular Economy Score · Landfill Diversion Score · Estimated Annual Savings · Carbon Avoided · Recoverable Material Value · Recycling Potential.

Two of these render as gauges, the rest as number cards:

- **RadialGauge** component (Recharts `RadialBarChart`) for Circular Economy Score with band labels (Poor / Average / Good / Excellent).
- **ProgressGauge** for Landfill Diversion Score using same band scale.

Charts row (Recharts, brand palette):

- Pie — waste composition % by material.
- Bar — weight (kg) by material.
- Line — waste trend over time (existing series, restyled).
- Donut — Recyclable vs Landfill.

Carbon impact card shows kg CO₂e + the 3 equivalences with icons.

### 5. Insights page upgrade — `dashboard.insights.tsx`

Each insight card becomes a mini-report:

- Header: date, image thumbnail (signed URL), `highlight` line as a chip.
- Material breakdown table: `Material · Weight · % · Recyclable · Confidence` (the user's example shape).
- Three small KPI tiles: Circular Score, Diversion Score, Recoverable Value.
- Recommendations rendered as numbered consultant-tone insights.
- "Insight cards" strip at top of page surfaces the best aggregate findings ("90% of this stream is recyclable", "Potential savings R3,500", "Highest opportunity: Cardboard").

### 6. Analytics page — `dashboard.analytics.tsx`

Adds the donut (recyclable vs landfill) and a horizontal bar of material value (R) alongside existing trend charts. Same page, no new route.

### 7. Investor-grade PDF — `dashboard.reports.tsx`

Rewrite `downloadPDF` with `jspdf` + `jspdf-autotable` (already common pair; will add `jspdf-autotable` if missing). Sections, in order:

1. Cover (logo, company, period, generated date)
2. Executive Summary (narrative built from KPIs + highlight)
3. Waste Composition (table + pct)
4. Material Breakdown (per-material table with weight/value/recyclability)
5. Circular Economy Score (with band)
6. Landfill Diversion Score (with band)
7. Estimated Cost Savings
8. Recoverable Material Value
9. Carbon Impact (kg + equivalences)
10. Recommendations (numbered)
11. Future Improvement Opportunities (derived from low-scoring materials)

CSV export gains the new columns. Generated reports are also written to `public.reports.payload` for history.

### 8. New presentation components

Under `src/components/dashboard/`:

- `KpiCard.tsx` — glassmorphism premium card, optional trend, large number.
- `RadialGauge.tsx` — Recharts radial bar with band label.
- `ProgressGauge.tsx` — horizontal gauge with Poor→Excellent ticks.
- `MaterialTable.tsx` — per-material breakdown table.
- `InsightChip.tsx` — colored highlight pill.
- `EquivalenceTile.tsx` — icon + label + value (trees/km/bottles).

Uses existing tokens only (`--primary #009879`, `--primary-light #17B890`, bg `#F8FAFC`, text `#0F172A`); adds a `--glass` token + `backdrop-blur` utility in `styles.css`.

---

### Technical notes

- AI model stays `google/gemini-2.5-flash` (multimodal, cheap). JSON-mode response, defensive parser, fallback shape preserved.
- All new fields are nullable → old insight rows still render (UI falls back to legacy `classification`/`recyclable_pct`).
- All math (scores, equivalences, totals) computed server-side in `dashboard.functions.ts` so the client stays presentational.
- No new routes, no auth changes, no storage changes.
- Bundle additions: `jspdf-autotable` (~30KB) only.

### Out of scope (per instructions)

No redesign of layout/navigation, no new pages, no IoT/marketplace/smart bins, no auth or schema beyond the additive columns above.
