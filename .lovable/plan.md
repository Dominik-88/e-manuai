
# Plan: Areály module — interactive grid + status tracking + offline sync

Před začátkem reality check + zarovnání s existujícími patterny v projektu.

## Co už máme (nepředělávat)

| Feature | Stav |
|---|---|
| Seznam areálů + filtry + search | `AreasPage.tsx` |
| Mapa s markery + clustering | `AreasMap.tsx` |
| CSV/Excel export areálů | `exportAreasToExcel` v `lib/export.ts` |
| Lucide-react ikony | Standard v projektu |
| Offline queue | `lib/offline-queue.ts` |
| Glassmorphism + Field design | `mem://style/field-design-system` |

## Reality check vůči zadání

| Požadavek | Verdict | Důvod |
|---|---|---|
| Smart Toggle Posekáno/Neposekáno | **DELIVER** — ale jako derivace z `seceni_relace`, ne nový sloupec |
| Konfety + vibrace | **MINIMAL** — přidám `navigator.vibrate(50)`, konfety vynechám (bundle vs. užitek pro operátora s rukavicí) |
| Undo s dialogem | **DELIVER** — sonner toast s "Vrátit zpět" akcí, 5s timeout |
| Historie změn (timestamp + operátor) | **EXISTUJE** — `seceni_relace` už má `user_id` + `datum_cas_start/konec` |
| Geofencing auto-suggest | **DELIVER** — `navigator.geolocation` + haversine match nejbližšího areálu (do 200m) |
| Progress dashboard "Dnes hotovo" | **DELIVER** — nahoře nad gridem, dnešní agregace ze `seceni_relace` |
| Prioritizace dle dnů od sečení | **DELIVER** — výpočet z poslední `seceni_relace` per areál |
| Fotodokumentace | **OUT OF SCOPE pro tento loop** — vyžaduje storage bucket + multi-step flow. Navrhuji jako follow-up. |
| Poznámky z terénu | **DELIVER** — krátký textarea v dialog při odškrtnutí, uloží se do `seceni_relace.poznamky` |
| PDF export protokolu | **DELIVER** — nová funkce `exportAreasReportPDF` v `lib/export.ts` |
| Glassmorphism karty | **DELIVER** v `AreaCard.tsx` |
| `framer-motion` | **NEINSTALOVAT** — projekt používá Tailwind animace + `tailwindcss-animate`. Memory `react-runtime-stability` říká minimalizovat deps. CSS `transition-all` + Tailwind keyframes pokryje vše potřebné. |

## Architektura — jak se "Posekáno" počítá

Žádný nový sloupec v `arealy`. Stav = derivace:
- Areál má v `seceni_relace` záznam s `datum_cas_konec >= start_of_today` → **Posekáno (dnes)**
- Poslední sečení < 7 dní → **OK (zelená pulse off)**
- 7–14 dní → **Střední priorita (žlutá)**
- > 14 dní nebo nikdy → **Vysoká priorita (červená pulse)**

Toggle "Posekat/Vrátit":
- **Posekat** → INSERT do `seceni_relace` (start=now, konec=now, mth_start=current MTH, plocha = areal.plocha_m2, rezim='manuální', poznámky volitelné)
- **Vrátit zpět** → DELETE posledního dnešního záznamu pro daný areál (RLS to už dovolí pro vlastníka)

Offline: použít `saveOperationRecord` z existujícího `offline-queue.ts`, rozšířit o typ `seceni_quick`.

## Soubory

| Soubor | Akce |
|---|---|
| `src/components/areas/AreaCard.tsx` | **Nový** — glassmorphism karta s toggle, prioritou, last-mowed |
| `src/components/areas/AreaProgressBar.tsx` | **Nový** — "Dnes hotovo: X/Y · Z %" |
| `src/components/areas/QuickMowDialog.tsx` | **Nový** — dialog s polem pro poznámku + potvrzení |
| `src/hooks/useAreaStatuses.ts` | **Nový** — agreguje `seceni_relace` per areál → status + lastMowed + priorita |
| `src/hooks/useNearestArea.ts` | **Nový** — geolocation watcher + haversine match |
| `src/pages/AreasPage.tsx` | Přidat ProgressBar nahoru, přepnout list view na grid `AreaCard`, filtry "Jen neposekané dnes" / "Vysoká priorita" |
| `src/lib/offline-queue.ts` | Přidat `saveQuickMow(arealId, machineId, mth, note?)` a sync handler |
| `src/lib/export.ts` | Přidat `exportAreasReportPDF(areas, sessions, dateRange)` |
| `src/index.css` | Přidat `.glass-card` + keyframe `priority-pulse` |

Bez DB migrace. Bez nových npm závislostí.

## Out of scope (deliberate, návrh follow-up)

- **Fotodokumentace** — vyžaduje storage bucket + RLS + UI flow, vlastní loop
- **Konfety** — bundle (canvas-confetti ~14KB) vs. užitek pro operátora, vynecháno; vibration stačí
- **framer-motion** — duplicitní s Tailwind animations už v projektu

## Otázka před start

Plocha "posekáno" v progress baru — počítat jako **součet `arealy.plocha_m2`** za posekané areály (rychlé, ale ignoruje skutečnou pokrytou plochu), nebo jako **součet `seceni_relace.plocha_posekana_m2`** (přesnější, ale závisí na vyplnění)? Default navrhuju **areal.plocha_m2** — odpovídá "100% areálu = posekáno odškrtnutím", což je field UX cíl.
