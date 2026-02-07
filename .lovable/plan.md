
# Opravy: notifikace, historie, rychle akce, m2, FAB, mazani, fotak, dotyk, header

## 1. Notifikace -- pridani tlacitka "Smazat/Odmitnout"

**Soubor:** `src/components/layout/NotificationCenter.tsx`

- Kazda notifikace dostane tlacitko "X" (dismiss), ktere ji odstrani z lokalniho stavu
- Stav dismissed notifikaci se ulozi do `localStorage` (`dismissed-notifications`), aby prezil restart aplikace
- Klic bude `interval.id + lastServiceMth` -- pri novem servisu se resetuje

## 2. Historie seceni -- pridani moznosti smazat relaci

**Soubor:** `src/components/digital-twin/SessionHistory.tsx`

- Pridani tlacitka "Smazat" (ikona Trash2) ke kazde relaci
- Po kliknuti se zobrazi potvrzovaci dialog
- Smazani pomoci `supabase.from('seceni_relace').delete().eq('id', ...)`
- Invalidace query `mowing-sessions`

## 3. Rychle potvrzeni ukonu -- restart intervalu (persistentni)

**Soubor:** `src/components/dashboard/ServiceIntervalsOverview.tsx`

- Ke kazdemu intervalu pridat tlacitko "Potvrdit ukon" (checkmark)
- Po kliknuti se vytvori servisni zaznam s aktualnim MTH a datem (stejne jako QuickServiceConfirm)
- Servisni zaznam se provaze s `servisni_interval_id` daneho intervalu
- Tim se interval automaticky "restartuje" -- protoze logika pocita `lastServiceMth` z tabulky `servisni_zaznamy`
- Data jsou v databazi = preziji restart, vypnuti, vsechno
- Hapticky feedback + toast "Interval restartoavan"

**Soubor:** `src/components/dashboard/QuickServiceConfirm.tsx`
- Odstraneni samostatneho widgetu (presunuto primo k intervalom)

## 4. Vsude uvadej pouze m2 (ne ha)

**Soubory:**
- `src/components/map/AreasMap.tsx` -- zmena `(plocha_m2 / 10000).toFixed(2) ha` na `plocha_m2.toLocaleString('cs-CZ') m2`
- `src/components/map/AreaPopup.tsx` -- odstranit `ha` konverzi
- `src/pages/AreasPage.tsx` -- zmena `(totalArea / 10000).toFixed(1) ha` na `totalArea.toLocaleString('cs-CZ') m2`
- `src/components/dashboard/AreaStats.tsx` -- zmena `ha` na `m2`

## 5. FAB tlacitko -- presun na okraj

**Soubor:** `src/components/layout/FloatingActionButton.tsx`

- FAB je aktualne `right-6` (24px od kraje). Uzivatel rika ze stale prekazi.
- Zmena na mensi FAB (`h-12 w-12` misto `h-14 w-14`) a presun nize k bottom nav (`bottom: calc(4.5rem + safe-area)`)
- Alternativne: zmena na `right-4` s polotransparentnim pozadim, aby neprekryvalo obsah

## 6. Mazani servisnich zaznamu nefunguje

**Problem:** RLS policy na `servisni_zaznamy` DELETE je omezena na `admin` a `technik`. Ale mazani probiha pres UPDATE (soft-delete `is_deleted = true`), ne pres DELETE. UPDATE policy povoluje vlastnikovi (`auth.uid() = user_id`) NEBO admin/technik.

Pravdepodobny problem: funkce `insert_audit_log` je volana pres `supabase.rpc()` a muze selhavat, coz zpusobi chybu v `try/catch` a zaznam se tvari jako nesmazany.

**Oprava:**
- V `ServicePage.tsx` a `ServiceDetailPage.tsx` -- oddelit audit log od hlavni operace. Pokud audit selze, soft-delete uz probehl.
- Pridat lepsi error logging a toast s konkretni chybou
- Overit ze `insert_audit_log` RPC existuje a funguje

## 7. Fotak a galerie nefunguje

**Soubor:** `src/components/diagnostics/AIDiagnostics.tsx`

- Problem: `capture="environment"` atribut je natvrdo na inputu. Na nekterych zarizenich to blokuje otevreni galerie.
- Galerie button odebira `capture` atribut, ale muze byt race condition -- `click()` se provede pred `removeAttribute`
- Oprava: pouzit 2 separatni inputy -- jeden s `capture="environment"` pro fotoaparat, druhy bez capture pro galerii
- Pripadne pouzit `setTimeout` pred `.click()` pro jistotu

## 8. Dotyk displeje -- katastrofa

**Soubory:** `src/styles/industrial.css`, `src/index.css`

- Pridat globalni `touch-action: manipulation` na interaktivni prvky (button, a, input, select)
- Pridat `-webkit-tap-highlight-color: transparent` globalne
- Zvetsit minimalni touch targety na 44px tam, kde je to mensi
- Overit ze na bottom nav, headeru a vsech tlacitkach je `min-height: 44px`

## 9. Header -- logo BHV a fotka stroje

**Soubory:**
- Zkopirovat `user-uploads://IMG_8415.jpeg` do `public/images/barbieri-hero.jpeg`
- `src/components/layout/AppHeader.tsx`:
  - Zmenit "B" logo na "BHV" text v logu (mensi font)
  - Pridat fotku stroje jako pozadi headeru nebo jako maly obrazek vedle loga

## Poradi implementace

1. Fotak fix (2 separatni inputy)
2. Touch CSS globalni opravy
3. FAB zmensi + pozice
4. m2 vsude (4 soubory)
5. Mazani servisnich zaznamu -- oddeleni auditu
6. Notifikace dismiss s localStorage
7. Historie seceni -- smazani relace
8. Rychle akce u intervalu (restart)
9. Header BHV + hero fotka
