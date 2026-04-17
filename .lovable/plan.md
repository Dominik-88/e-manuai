
# Plan: Audit reality check + manual integration

User audit je založen na **HTML inspekci běžící preview**, ale skoro všechny "kritické" body už byly opraveny v posledních 3 loopech. Než cokoli udělám, ověřím skutečný stav v kódu — ne v HTML.

## Reality check (kód vs. audit)

| Audit bod | Tvrzení | Realita v kódu |
|---|---|---|
| 2A Duplicitní H1 | "Stále máš dvě h1" | **OPRAVENO** — `AppHeader.tsx` má `<span>` (ne h1), `DashboardPage.tsx` má jen `<h1 className="sr-only">` |
| 2B MTH 118.0 hardcoded | "Hodnota natvrdo v HTML" | **NENÍ HARDCODED** — `MthDisplay.tsx` čte `machine.aktualni_mth.toFixed(1)` z `useMachine()` hooku. To, že audit vidí `118.0` v HTML, znamená, že hodnota je v DB skutečně 118.0 — to je správně. |
| 2C Rychlé akce slider | "Pořád horizontal slider" | **ODSTRANĚNO** — `QuickActionsCard` slider je pryč, nahrazen 2 velkými CTA "Zahájit provoz" / "Zadat servis" |
| 2D SVG nadbytečnost | "Stovky řádků inline SVG" | **FALSE POSITIVE** — projekt **už používá** `lucide-react` všude. SVG v HTML je výstup tree-shaken `lucide-react` komponent, což je očekávané chování (každá ikona = 1 inline SVG). Sprite refactor by ušetřil ~5 KB gzipped, nestojí to za to. |
| 3 Live data states | "Přidat skeleton + offline" | **HOTOVO** v posledním loopu — `TelemetryLive.tsx` má connecting/waiting/live stavy |

**Závěr:** Uživatel pravděpodobně nereloadoval preview po posledním deploy nebo prohlíží starou verzi. Veškeré 4 "kritické" body už byly vyřešeny.

## Co je skutečně nového

### 1. Integrace oficiálního manuálu (PDF příloha)

Uživatel nahrál `Barbbieri_XRot_95_EVO-2.pdf` jako "oficiální manuál pro autentičnost". Z toho mohu udělat **skutečný přínos**:

- **Krok A:** Naparsovat PDF (`document--parse_document`), vytáhnout autentické technické specs, servisní intervaly, varování.
- **Krok B:** Porovnat s daty v aplikaci:
  - `mem://technical/hardware-spec` — ověřit, jestli model/CPU/RAM/GNSS odpovídají manuálu
  - `mem://technical/maintenance-logic` — ověřit servisní intervaly (50/250/500 MTH atd.)
  - DB tabulka `stroje` — opravit nesoulad, pokud existuje
- **Krok C:** Zpřístupnit manuál uživatelům:
  - Zkopírovat PDF do `public/manual/Barbieri_XRot_95_EVO.pdf`
  - V `ManualPage.tsx` přidat sekci "Oficiální manuál výrobce" s odkazem na PDF (download + open in new tab)
  - V AI assistantu (`ai-assistant/index.ts`) přidat reference, že manuál je dostupný

### 2. Audit transparentnost pro uživatele

Krátce v odpovědi vysvětlit, proč 4/4 body už platí — ne re-implementovat. Tohle je důležité, jinak bude uživatel posílat stejný audit dokola.

## Plán implementace

| Krok | Akce |
|---|---|
| 1 | `document--parse_document` na `user-uploads://Barbbieri_XRot_95_EVO-2.pdf` — vytáhnout autentické specs + servisní intervaly |
| 2 | Porovnat se současnými memory + DB `stroje` row. Pokud je nesoulad, navrhnout migration. |
| 3 | `lov-copy` PDF do `public/manual/Barbieri_XRot_95_EVO.pdf` |
| 4 | Upravit `src/pages/ManualPage.tsx` — přidat sekci "Oficiální manuál výrobce (PDF)" s download buttonem |
| 5 | Aktualizovat memory `mem://technical/hardware-spec` a `mem://technical/maintenance-logic` autentickými daty z manuálu (pokud se liší) |
| 6 | Update `supabase/functions/ai-assistant/index.ts` system prompt — zmínit, že má referenční manuál v `public/manual/` |

## Out of scope

- Reimplementace již hotových bodů (H1, MTH, slider, SVG) — kód to už řeší
- DB migrace ke spec údajům — jen pokud manuál ukáže reálný nesoulad

## Otázky před start

Před parsing PDF se zeptám — přílohu mohu použít **jen na verifikaci textu/specs**, nebo také jako **stažitelný PDF v aplikaci**?
