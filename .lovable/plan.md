
# Plan: Production hardening — Live data states, dashboard CRO, PWA robustness

Audit požadavků vs. aktuální stav. Většina kritických bodů (#2.1, #2.2, #4.1) už **byla implementována** v předchozím loopu. Tento plán pokrývá jen **skutečnou novou práci**.

## Co je už hotovo (skip)

| Požadavek | Stav |
|---|---|
| 2.1 AI Diagnostika `<label htmlFor>` + `capture="environment"` | Hotovo |
| 2.2 Duplicitní H1 odstraněn, header brand = `<span>` | Hotovo |
| 4.1 Slider → 2 velké CTA "Zahájit provoz" / "Zadat servis" | Hotovo |
| 5.1 Ikony přes `lucide-react` | Už používáno |
| 5.2 Offline IndexedDB queue pro servisní záznamy | `src/lib/offline-queue.ts` existuje |

## Skutečně k implementaci

### 1. Live-Ready stavy pro telemetrii (3.1) — HLAVNÍ PRÁCE

V `src/components/dashboard/TelemetryLive.tsx` přidat 3 jasné vizuální stavy řízené `connectionState` z `useBarbieriiClient`:

- **Connecting** (`connectionState === 'connecting'`): `<Skeleton>` bloky místo hodnot RTK / rychlost / GPS / baterie. Komponent `Skeleton` už existuje (`src/components/ui/skeleton.tsx`).
- **Waiting / Stale** (`connectionState === 'stale'` nebo `!telemetry`): hodnoty zobrazí `—` + malý badge `Čekám na data ze stroje…` (žlutý outline badge).
- **Live** (`connectionState === 'connected' && telemetry`): aktuální hodnoty + zelený puls indikátor (už existuje).

Pozn.: Counter-animace čísel je nice-to-have, ale přidává závislost (framer-motion / react-countup). **Vynechávám** — místo toho jen krátký 200ms tween na `transition-all` u CSS — udržuje bundle malý, vizuálně postačí.

### 2. Connection indikátor v hlavičce (3.2)

V `src/components/layout/AppHeader.tsx` přidat malý dot vedle `vyrobni_cislo`:
- Zelená tečka + "Online" pokud `connectionState === 'connected'`
- Šedá tečka + "Offline" jinak
- Žlutá tečka + "Stale" pokud `'stale'`

Vyžaduje volat `useBarbieriiClient()` v headeru. Hook už je singleton (`getBarbieriClient()`), takže to nezduplikuje připojení. Přidat pouze sub na `connectionState`.

### 3. Přesun MachineStatusCard na samostatnou stránku (3.2)

Vytvořit `src/pages/MachineDetailPage.tsx` na route `/stroj/detaily`:
- Renderuje `MachineStatusCard` + případně `MthDisplay` v read-only režimu
- Přidat route do `src/App.tsx` (lazy)
- Z `SettingsPage` (nebo jiného vhodného místa) přidat odkaz "Technické specifikace stroje →"

`MachineStatusCard` je už z dashboardu odstraněn, takže zde jen tvoříme nové místo, kam patří.

### 4. FAB UX polish (4.2)

V `src/components/layout/FloatingActionButton.tsx`:
- Backdrop blur overlay (fixed, `bg-background/40 backdrop-blur-sm`) když `isOpen`
- Klik na backdrop zavře menu
- Položky menu: garantovat `min-h-12 min-w-12` (48px touch target)
- Sekundární tlačítka v menu: zvýšit kontrast (přidat `border-2`)

### 5. Service Worker strategie (5.2)

V `public/sw.js` aktualizovat fetch handler:
- **Stale-While-Revalidate** pro assety (`/assets/*`, `*.js`, `*.css`, `*.woff2`)
- **Network-First s 3s timeoutem** pro Supabase REST/Realtime requesty (`*.supabase.co/rest/*`, `*.supabase.co/auth/*`)
- **Cache-First** pro tile mapy a obrázky
- Bump cache version → `v1.0.2`

Pozn.: SW se v preview iframe stejně neregistruje (logika z předchozího loopu), tohle se uplatní jen v produkci na `e-manuai.lovable.app`.

## Out of scope (deliberate)

- **Counter animace čísel** — bundle vs. užitek nepoměr (operátor v terénu nepotřebuje efekty)
- **MQTT** — projekt používá Supabase Realtime (memory'd jako standard), MQTT vyžaduje broker, který tu není
- **SVG sprite refactor** — `lucide-react` už dělá tree-shake, sprite by nepřinesl měřitelný zisk
- **Lighthouse 95+ jako akceptační kritérium** — dáme nejlepší úsilí, ale skóre závisí i na PWA cache headers, které nemůžeme z preview ověřit
- **Smazat statické MTH/spec hodnoty** — nejsou statické, čtou se z `stroje` tabulky

## Soubory

| Soubor | Akce |
|---|---|
| `src/components/dashboard/TelemetryLive.tsx` | Přidat 3 stavy: skeleton / waiting / live |
| `src/components/layout/AppHeader.tsx` | Connection dot vedle vyrobni_cislo |
| `src/pages/MachineDetailPage.tsx` | **Nový** — read-only spec stránka |
| `src/App.tsx` | Lazy route `/stroj/detaily` |
| `src/pages/SettingsPage.tsx` | Odkaz na `/stroj/detaily` |
| `src/components/layout/FloatingActionButton.tsx` | Backdrop blur + 48px targets |
| `public/sw.js` | Stale-While-Revalidate + Network-First strategie |

Bez DB migrace. Bez nových závislostí.
