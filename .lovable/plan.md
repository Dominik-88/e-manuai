
# Plan: Vrátit servisní intervaly na dashboard (kompaktní top-3)

Audit identifikoval **jednu prioritní regresi**: `ServiceIntervalsOverview` zmizel z dashboardu. Operátor nevidí nejbližší údržbu bez navigace na `/servis`. Ostatní body auditu jsou buď hotové (✅) nebo deliberate out-of-scope.

## Realita check

Existuje `src/components/dashboard/ServiceIntervalsOverview.tsx` — full widget se 3 summary kartami, kritickými alerty, list všech intervalů a quick-confirm tlačítkem. **Pro dashboard je to overkill** (zabere celou obrazovku). Audit chce **kompaktní variantu — top 3, mini progress bary, link na /servis**.

## Řešení: Nový kompaktní widget, ne návrat starého

| Soubor | Akce |
|---|---|
| `src/components/dashboard/ServiceIntervalsCompact.tsx` | **Nový** — top 3 nejbližší intervaly, mini progress bary, link "Všechny intervaly →" |
| `src/pages/DashboardPage.tsx` | Vložit `<ServiceIntervalsCompact />` mezi `AreaStats` a `RecentActivityCard` |

### Logika `ServiceIntervalsCompact`

- Reuse stejnou query logiku jako `ServiceIntervalsOverview`: fetch `servisni_intervaly` + `servisni_zaznamy` per `machineId`.
- Pro každý interval spočítat `remainingMth` a `percentRemaining` (stejný vzorec).
- **Sort by `remainingMth` ASC** (nejkritičtější první), `slice(0, 3)`.
- Render: `nazev` vlevo, mini progress bar (w-20 h-1.5) + `{remaining} mth` vpravo.
- Barva progress baru podle stavu: critical → `bg-destructive`, warning → `bg-warning`, ok → `bg-success`.
- Footer: `<Link to="/servis">Všechny intervaly →</Link>`.
- Wrap v `<section aria-label="Servisní intervaly">` (sémantika dle auditu).
- Loading skeleton (3 řádky shimmer), empty state ("Žádné servisní intervaly nejsou nakonfigurovány").
- Použít existující `dashboard-widget` class pro styling konzistentní s ostatními widgety.

### Pozice na dashboardu

```
MthDisplay
Hlavní akce (CTA grid)
AreaStats
ServiceIntervalsCompact   ← NOVÉ
RecentActivityCard
[Collapsible Digital Twin]
TelemetryLive
AIDiagnostics
```

Server intervaly nad RecentActivity = urgent info above-the-fold, recent activity jako sekundární kontext.

## Out of scope (deliberate)

| Audit bod | Důvod |
|---|---|
| Empty state provozních statistik | Jiný komponent (`AreaStats`), oddělený task |
| `<span>` → `<p>` v headeru | Kosmetické, `<span>` je validní pro brand text |
| Offline indikátor "Online vs. Stroj offline" konflikt | Audit má pravdu, ale vyžaduje redesign `OfflineIndicator` + `AppHeader` — vlastní loop |
| date-fns → Intl.RelativeTimeFormat | Refactor napříč 5+ komponentami, vlastní loop |
| OG image URL, twitter:card | Marketing meta, ne field UX, neprio |

Bez DB migrace. Bez nových závislostí. Reuse existujících queries (React Query cache → žádný extra network call, sdílí se s `ServiceIntervalsOverview` na `/servis`).
