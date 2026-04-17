
# Plan: UX & accessibility quick wins from audit

Focusing on the highest-impact items that match our existing architecture. Skipping items that conflict with prior decisions (FAB stays — already memory'd as primary entry point) or are out of scope (SVG sprite refactor, lazy-loading vendor chunks).

## 1. Fix AI Diagnostics camera/gallery (CRITICAL — accessibility + iOS Safari reliability)

In `src/components/diagnostics/AIDiagnostics.tsx`, replace the `<button>` + hidden `<input ref>` + synthetic `.click()` pattern with native `<label htmlFor>` + `sr-only` input. This is the audit's #1 critical issue and a real iOS Safari risk for camera permission gating.

- Two inputs with stable IDs: `ai-camera-upload` (capture="environment") and `ai-gallery-upload`.
- Two `<label>` elements styled exactly like the current buttons (full button styling, `cursor-pointer`, `tabIndex={0}`).
- Drop the `cameraInputRef` / `galleryInputRef` refs.
- Keep `handleFile` logic identical.

## 2. Remove duplicate H1 + author tagline (semantics + above-the-fold space)

In `src/pages/DashboardPage.tsx`: drop the centered `e-ManuAI • by • Dominik Schmied` block entirely. Add a single `<h1 className="sr-only">` for AT.

In `src/components/layout/AppHeader.tsx`: change the header `<h1>e-ManuAI</h1>` to a `<span>` (branding, not a heading).

## 3. Fix MTH header link affordance

In `src/components/layout/AppHeader.tsx`: change MTH `<Link to="/">` → `<Link to="/nastaveni">`. Tapping the MTH number should go somewhere meaningful, not reload home.

## 4. Move "Technické specifikace" off the dashboard

Remove `<MachineStatusCard>` from `DashboardPage.tsx`. Static spec data (CPU, GNSS, working width) doesn't belong on a daily ops dashboard. It already renders inside Settings-relevant context; we'll just stop showing it on home.

## 5. Replace "Rychlé akce" slider with 2 large primary CTAs

In `src/pages/DashboardPage.tsx`: replace `<QuickActionsCard>` with two big buttons directly under `MthDisplay`:
- **"Zahájit provoz"** → `/provoz/novy`
- **"Zadat servis"** → `/servis/novy`

Sized for gloved-hand use: `h-16`, `text-base font-bold`, full width grid `grid-cols-2 gap-3`. Keeps FAB for the third action (Nový areál) — no duplication, since the slider goes away.

## 6. Bottom nav cleanup

In `src/components/layout/BottomNav.tsx`:
- Rename `AI` → `Asistent`.
- Add `aria-current="page"` only on the active link (already correct — verify).
- Reduce active-state indicators from 4 (bg + underline + scale + bold) to 2 (bg + bold).

## 7. Quick polish

- `MthDisplay.tsx`: bump "Upravit MTH" tap target from `h-8` → `h-11`.
- `TelemetryLive.tsx` (or wherever `192.168.4.1:5000` link lives): add inline `(vyžaduje WiFi stroje)` hint + `title` tooltip.

## Out of scope (deliberate)
- **Keep FAB** — memory'd decision, audit's "remove FAB OR slider" is satisfied by removing the slider.
- SVG sprite refactor (large cross-cutting change, low ROI now).
- Lazy-loading floating-ui (Radix uses it eagerly; not a clean win).
- `date-fns` → `Intl.RelativeTimeFormat` (separate pass).

## Files touched

| File | Change |
|---|---|
| `src/components/diagnostics/AIDiagnostics.tsx` | label+input refactor |
| `src/pages/DashboardPage.tsx` | drop tagline, drop MachineStatusCard, drop QuickActionsCard, add 2 CTAs, sr-only h1 |
| `src/components/layout/AppHeader.tsx` | h1→span, MTH link → /nastaveni |
| `src/components/layout/BottomNav.tsx` | label + active-state cleanup |
| `src/components/dashboard/MthDisplay.tsx` | h-8 → h-11 |
| `src/components/dashboard/TelemetryLive.tsx` | WiFi-only hint on machine link |

No DB migration. No new dependencies.
