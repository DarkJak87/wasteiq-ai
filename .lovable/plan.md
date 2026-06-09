
# WasteIQ AI — Build Plan

A premium climate-tech SaaS: public marketing site, Supabase auth, full user dashboard with upload → AI waste analysis → insights/reports → analytics, admin panel, and Stripe-powered billing in ZAR.

## Stack

- TanStack Start + React 19 + Tailwind v4 + shadcn/ui (already scaffolded)
- Lovable Cloud (Supabase): Postgres, Auth, Storage
- Lovable AI Gateway (`google/gemini-2.5-flash`) for multimodal waste analysis (images + PDFs)
- Lovable Payments (Stripe, ZAR) for Starter / Growth / Enterprise
- Recharts for charts, jsPDF + papaparse for PDF/CSV exports

## Design System

Tokens added to `src/styles.css` (oklch) — never raw colors in components.
- `--primary` #0F766E (teal), `--secondary` #14532D (deep green), `--accent` #84CC16 (lime)
- `--background` #F8FAFC light / #0B1220 dark, `--foreground` #111827
- Gradients: `--gradient-hero`, `--gradient-card`; shadows: `--shadow-elegant`, `--shadow-glow`
- Glass utility: `.glass` (backdrop-blur + border + bg with alpha)
- Typography: Inter via Google Fonts; large display sizes for hero
- Animations: fade-in, scale-in, slide-up, subtle gradient drift on hero background

Inspiration: Stripe/Linear/Notion/Watershed — generous whitespace, soft shadows, glass cards, animated gradient backgrounds, crisp data viz.

## Routes (file-based)

```
src/routes/
  __root.tsx                 (HeadContent, Toaster, QueryClient, auth listener)
  index.tsx                  (Home)
  features.tsx
  pricing.tsx
  about.tsx
  contact.tsx
  privacy.tsx
  terms.tsx
  auth.tsx                   (login + register tabs)
  reset-password.tsx
  _authenticated/
    route.tsx                (integration-managed gate, ssr:false)
    dashboard/route.tsx      (sidebar layout w/ Outlet)
    dashboard/index.tsx      (Overview KPIs + charts)
    dashboard/uploads.tsx
    dashboard/insights.tsx
    dashboard/reports.tsx
    dashboard/analytics.tsx
    dashboard/settings.tsx
    dashboard/billing.tsx
    dashboard/admin.tsx      (role-gated client-side; server enforces)
  api/public/stripe-webhook.ts
```

Each public route ships its own `head()` (title, description, og:*).

## Database (migrations)

Tables in `public` (each followed by GRANTs + RLS + policies per project rules):

- `profiles` (id uuid PK → auth.users, full_name, avatar_url, created_at)
- `companies` (id, owner_id → auth.users, name, industry, province, employee_count, waste_collector, logo_url)
- `company_members` (company_id, user_id, role) — for multi-user/admin
- `user_roles` (id, user_id, role app_role enum: 'admin'|'user') + `has_role()` SECURITY DEFINER
- `uploads` (id, company_id, user_id, file_path, file_type, original_name, size_bytes, status: pending|processed|failed, created_at)
- `insights` (id, upload_id, company_id, summary text, recommendations jsonb, classification jsonb {plastic,glass,paper,metal,organic,general}, estimated_savings_zar numeric, carbon_kg numeric, recyclable_pct numeric, created_at)
- `reports` (id, company_id, type, period_start, period_end, file_path, created_at)
- `analytics_monthly` (company_id, month, waste_kg, recycled_kg, landfill_kg, cost_zar, carbon_kg)
- `subscriptions` (id, company_id, stripe_customer_id, stripe_subscription_id, plan: starter|growth|enterprise, status, current_period_end)
- `notifications` (id, user_id, title, body, read, created_at)
- `audit_logs` (id, actor_id, action, target_type, target_id, meta jsonb, created_at)
- `settings` (company_id PK, notif_email bool, notif_inapp bool, …)

Trigger: on `auth.users` insert → create `profiles` row + default `companies` row + assign `user_role='user'`.

RLS: users see only their company's rows (via `company_members` lookup). Admins see all via `has_role(auth.uid(),'admin')`. Storage bucket `waste-uploads` (private) with policies scoped by `company_id` prefix.

## Server Functions (`src/lib/*.functions.ts`)

- `analyzeUpload.functions.ts` — `requireSupabaseAuth`; signs a short URL for the uploaded file, calls Lovable AI Gateway with multimodal content (image_url or file/PDF base64), prompts Gemini to return JSON: `{summary, recommendations[], classification{}, recyclable_pct, estimated_savings_zar, carbon_kg}`; inserts into `insights`; updates `uploads.status`. Handles 429/402 with friendly errors.
- `generateReport.functions.ts` — aggregates insights + analytics, renders a branded PDF (jsPDF) and CSV, uploads to `reports` bucket, inserts `reports` row, returns signed URL.
- `getDashboardData.functions.ts` — KPIs + chart series for current company.
- `adminListUsers/Companies/...` — gated by `has_role('admin')`.
- `createCheckoutSession` / `cancelSubscription` — Stripe checkout for plan selection.

`client.server.ts` (admin client) only imported inside `.handler()` via `await import(...)`.

## Public Pages

- **Home**: animated gradient hero with floating glass cards, headline + 2 CTAs (Start Free Trial → /auth, Book Demo → /contact); Features grid (8 cards w/ lucide icons); How It Works 4 steps; Stats strip (30% cost reduction, etc.); Testimonials (4 placeholder cards); Pricing preview; CTA footer.
- **Features**: detailed cards for each of the 8 features.
- **Pricing**: 3 plan cards (Starter R299, Growth R799, Enterprise Custom) with feature lists; Stripe checkout buttons (logged-in routes to checkout; logged-out → /auth).
- **About / Contact / Privacy / Terms**: clean content pages with consistent shell.

Shared `MarketingHeader` (logo + nav + Sign in / Get started) and `MarketingFooter`.

## Authentication

`/auth` page with Sign in / Sign up tabs, plus "Forgot password?" → `resetPasswordForEmail` with `redirectTo: ${origin}/reset-password`. `/reset-password` reads recovery hash and calls `updateUser`. `emailRedirectTo: window.location.origin` on signup. Google OAuth via Lovable broker (button "Continue with Google") — also call `supabase--configure_social_auth` for Google in the build.

## Dashboard

`AppSidebar` (shadcn sidebar, collapsible="icon") with sections: Overview, Uploads, Insights, Reports, Analytics, Settings, Billing, Admin (shown only when `has_role('admin')`). Top bar with `SidebarTrigger`, company switcher (if multiple), notifications bell, profile menu.

- **Overview**: 6 KPI cards (Total Waste, Recyclable, Diversion Score, Circular Score, Carbon Reduction, Monthly Cost) with sparkline + delta; Recharts: monthly trend (Area), composition (Pie), recycling vs landfill (Stacked Bar); AI recommendations panel; recent activity feed.
- **Uploads**: drag-and-drop (react-dropzone or native), accepts PDF/PNG/JPG/JPEG up to 10MB, progress per file, list with status badges, "Re-run analysis" action. On upload completion → calls `analyzeUpload`.
- **Insights**: card list of AI recommendations with impact score + estimated R savings; filter by category.
- **Reports**: list past reports + "Generate" button (select type + period) → PDF/CSV download.
- **Analytics**: full-page charts (trends, composition, recycling rate, diversion, carbon, savings).
- **Settings**: company profile form, notification toggles, avatar upload (Storage).
- **Billing**: current plan card, upgrade/downgrade via Stripe, invoice history (from Stripe).
- **Admin**: tables for Users, Companies, Uploads, Reports, Subscriptions, Audit logs; search + pagination.

## AI Waste Analysis Flow

1. User uploads → file goes to `waste-uploads/{company_id}/{uuid}.{ext}` (private bucket).
2. `analyzeUpload({uploadId})` server fn signs URL, builds multimodal `messages` for `google/gemini-2.5-flash`:
   - System prompt: "You are a waste-stream analyst for South African SMEs. Return strict JSON…"
   - User content: text instructions + `image_url` (for images) or `file` block (for PDFs base64).
3. Parse JSON (zod), insert `insights`, mark upload processed, push notification.
4. UI subscribes via TanStack Query refetch on `uploads` channel.

## Stripe Billing

Run `recommend_payment_provider` → `enable_stripe_payments`. After enable, use `batch_create_product` for Starter (R299/mo), Growth (R799/mo), Enterprise (contact). Set tax handling per knowledge file (likely `managed_payments` for SaaS). Checkout server fn returns hosted Stripe URL; webhook at `/api/public/stripe-webhook` (HMAC-verified) upserts `subscriptions`.

## Charts & Exports

- Recharts wrapped in shadcn `chart` primitives with design-token colors.
- PDF reports: jsPDF + jspdf-autotable with branded header/footer; CSV via papaparse.

## Build Order (single pass)

1. Design tokens + global styles + fonts + shared layout shells.
2. Public marketing pages.
3. Enable Lovable Cloud (already triggered if not), Supabase migrations (tables, RLS, GRANTs, trigger, roles, storage bucket+policies).
4. Auth pages + integration-managed `_authenticated` gate + Google OAuth.
5. Dashboard shell (sidebar, topbar) + Overview with mock-then-live data.
6. Uploads page + Storage wiring + `analyzeUpload` server fn (Lovable AI).
7. Insights, Analytics, Reports (with PDF/CSV export).
8. Settings, Notifications.
9. Stripe enable + products + Billing page + webhook.
10. Admin panel (role-gated).
11. SEO polish (per-route head, `/llms.txt`, sitemap-friendly routes).
12. QA pass: console errors, build, key flows (sign up → upload → analyze → report → checkout).

## Out of Scope (v1)

Future-features list (marketplace, smart bins, municipal reporting, predictive forecasting, AI assistant chat) — stubbed as "Coming soon" cards only.

## Notes

- Spec mentions Next.js/Vercel; building on Lovable's TanStack + Cloud as confirmed.
- PayFast replaced by Stripe (ZAR) per your choice; PayFast can be added later as a separate provider.
- All AI calls server-side via Lovable AI Gateway — no API keys required from you.
