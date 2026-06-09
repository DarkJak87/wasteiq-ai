## Goal

Adopt the pasted WasteIQ AI design system as the project's source of truth for colors, typography, radii, shadows, gradients, buttons, cards, inputs, KPI tiles, sidebar, and chart palette. Keep all existing Tailwind/shadcn semantic tokens working (`bg-primary`, `bg-card`, `text-foreground`, etc.) so no component visuals break — we map the new brand values onto the existing token names.

## Changes

### 1. `src/styles.css` — rewrite token layer

- Replace the current `:root` brand tokens with the new palette, converted to `oklch` (Tailwind v4 + shadcn requirement):
  - `--primary` ← `#009879`, `--primary-glow` ← `#17B890`
  - `--accent` ← `#35D6A6` (lighter variant `#73F5C8` kept as `--accent-glow`)
  - `--secondary` ← `#0F172A` (dark slate, for `dark-gradient`)
  - `--background` ← `#F8FAFC`, `--card`/`--popover`/`--surface` ← `#FFFFFF`
  - `--foreground` ← `#0F172A`, `--muted-foreground` ← `#64748B`, plus a new `--text-muted` ← `#94A3B8`
  - `--border` ← `#E2E8F0`, `--border-light` ← `#F1F5F9`, `--input` ← `#E2E8F0`
  - `--ring` ← `#009879`
  - Status tokens: `--success #22C55E`, `--warning #F59E0B`, `--destructive #EF4444`, `--info #3B82F6`
  - Sidebar tokens: bg `#FFFFFF`, border `#E2E8F0`, active `--sidebar-primary` `#009879`, hover surface `#F1F5F9`
  - Chart palette: `--chart-1..5` = `#009879, #17B890, #35D6A6, #22C55E, #0F172A`
- Update `--radius` to `1rem` so shadcn `rounded-lg` ≈ 16px and `--radius-xl` ≈ 24px (matches spec's card radius). Add explicit `--radius-sm 8px`, `--radius-md 12px`, `--radius-lg 16px`, `--radius-xl 24px` overrides in `@theme inline`.
- Replace shadow tokens with spec values: `--shadow-sm/md/lg/xl` using the rgba ramps from the spec, plus keep `--shadow-elegant` and `--shadow-glow` re-tuned to the new primary.
- Update gradients:
  - `--gradient-primary`: `linear-gradient(135deg, #009879, #17B890)` (hero / btn-primary)
  - `--gradient-accent`: `linear-gradient(135deg, #009879, #35D6A6)` (green-gradient)
  - `--gradient-dark`: `linear-gradient(135deg, #0F172A, #1E293B)`
  - `--gradient-hero`: keep radial wash but re-tinted with new primary/accent
- Refresh `.dark` block so dark mode uses the same brand hues with appropriate lightness (primary stays `#17B890`-ish, bg `#0F172A`, surface `#1E293B`).
- Add utility classes to back the spec's class names: `.hero-gradient`, `.green-gradient`, `.dark-gradient`, `.glass` (rewritten to use the new translucent white + blur — standard `backdrop-filter` only, no `-webkit-` hand prefix per Tailwind v4 gotchas), `.kpi-card`, `.kpi-value`, `.kpi-label`, `.chart1..5`. Buttons/inputs/cards keep using shadcn components, but their visual tokens now match the spec automatically.
- Typography: set base `font-family` stack to `Inter, "SF Pro Display", system-ui, sans-serif` (Inter is already loaded). Add base `h1 { font-size: clamp(40px, 6vw, 64px) }`, `h2 { clamp(32px, 4.5vw, 48px) }`, `h3 { 32px }` with the spec's weights, scoped under `@layer base` so existing per-page Tailwind size classes still override when needed.

### 2. Components — light touch-ups (only where defaults clash)

- `src/components/ui/button.tsx`: change the `default` variant to use the brand gradient (`bg-gradient-primary`) and `rounded-xl` so the primary CTA matches the spec's pill-rounded green button. `secondary`/`outline` already align.
- `src/components/ui/card.tsx`: bump default radius to `rounded-2xl` (24px) to match the spec's card radius. Shadow already pulls from tokens.
- `src/components/ui/input.tsx`: bump to `rounded-xl` (14px) and `h-11` so inputs match the spec.

No business logic, route, or content changes. No new dependencies.

## Out of scope

- No edits to dashboard data flows, server functions, auth, or routes.
- No replacement of shadcn components — only the variants/sizes above.
- No new fonts loaded (Inter is already in use).

## Technical notes

- Tailwind v4 requires `oklch` for tokens consumed via `@theme inline`. Hex values from the spec will be converted to their `oklch` equivalents and a short comment kept next to each token showing the original hex for traceability.
- `.glass` will use only the standard `backdrop-filter` property (no hand-written `-webkit-backdrop-filter`) to avoid the Lightning CSS dedupe issue that strips the standard property in production builds.
- Existing pages reference Tailwind semantic classes (`bg-primary`, `text-foreground`, `bg-card`, `border-border`, `bg-gradient-primary`, `shadow-elegant`, `bg-hero`) — all keep working because we're remapping the underlying tokens, not renaming classes.
