# WasteIQ AI — Claude Project Brief

## Project Overview
WasteIQ AI is a premium SaaS platform offering AI-powered waste analytics for South African businesses. It helps organisations reduce landfill waste, uncover recycling opportunities, cut disposal costs, and generate ESG-grade sustainability reports.

**Live site:** https://wasteiq-ai.lovable.app  
**Repo:** https://github.com/DarkJak87/wasteiq-ai  
**Built with:** Lovable (React + Vite + Tailwind CSS)

---

## Brand & Tone

- **Positioning:** Premium, trust-building, data-driven. Not greenwashing — proof-based outcomes.
- **Audience:** Sustainability leads, operations managers, CFOs at SA SMEs and corporates.
- **Tone:** Confident, precise, SA-aware. Avoid generic sustainability clichés.
- **Key compliance markers to preserve:** ESG-ready, POPIA compliant, GCIP-ready — always keep these visible where present.

### Brand language to use
- "Circular economy" not just "recycling"
- "Waste streams" not "rubbish"
- "Diversion" not "reducing waste"
- "ESG outcomes" not "going green"
- Rands (R) for currency, metric tonnes (t) for weight

---

## Site Structure

| Route | Page |
|---|---|
| `/` | Homepage (hero, features overview, how it works, social proof) |
| `/features` | Full features page |
| `/pricing` | Pricing page |
| `/about` | About page |
| `/contact` | Contact / Book a demo |
| `/auth` | Sign in / Start free |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

---

## Key Metrics & Stats (use these consistently)
- 98% stream accuracy
- R2.4M average savings per year
- 42% less to landfill
- Up to 30% reduction in waste costs
- 2.5× higher recycling rates
- −45% landfill dependency

---

## Core Features (always reference accurately)
1. AI Waste Analysis — multimodal AI reads invoices, receipts, photos
2. Sustainability Reports — ESG-grade PDFs for tenders and investors
3. Recycling Insights — identify divertable materials
4. Carbon Impact Tracking — CO₂e reductions per waste stream
5. Circular Economy Score — single benchmarkable score
6. Cost-Saving Recommendations — AI-driven collector and route suggestions
7. ESG Readiness — mapped to SA standards and global frameworks
8. Waste Diversion Analytics — interactive analytics from first upload

---

## Tech Stack Notes
- Framework: React (Vite)
- Styling: Tailwind CSS
- Deployment: Lovable → auto-deploys from GitHub on push to `main`
- AI integration mentioned in product: Gemini-powered multimodal AI

### Lovable-specific rules
- **Always push to `main`** — Lovable watches this branch and deploys automatically
- Do not change the build config or `vite.config.ts` unless explicitly asked
- Assets live in `src/assets/` — do not rename or move existing image files
- Keep component structure consistent with what Lovable generated

---

## How to Handle Dispatch Tasks

When receiving a task via Dispatch, follow this workflow:

1. **Read this file first** — always
2. **Check what page/component is affected** before making changes
3. **Make targeted edits** — don't refactor unrelated code
4. **Preserve all compliance copy** (POPIA, ESG, GCIP) exactly as written
5. **Keep stats consistent** — use the figures in this brief, don't invent new ones
6. **Push to `main`** when done and confirm the change in your response

### Example task formats Phumi will send
- "Update the hero headline to X"
- "Add a new testimonial from [name], [title], [city]: [quote]"
- "Add [feature] to the features page"
- "Fix the CTA button on the pricing page"
- "Change the pricing for [plan] to R[X]/month"

---

## Do Not Change Without Explicit Instruction
- Logo or brand name
- POPIA / ESG / GCIP compliance badges
- Existing metric values (unless asked to update)
- The `/auth` flow or any authentication logic
- Footer legal links
