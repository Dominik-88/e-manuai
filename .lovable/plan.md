
# Opravy mapy, popupov, clusteringu a dashboardu

## Prehled

Reseni 5 konkretnich problemu:

1. **Vsechny arealy jsou vodojemy** -- ikony markeru se meni podle `typ` sloupce v DB (vodojem/upravna vody/cerpaci stanice/vrt), ale uzivatel rika, ze vse jsou vodojemy firmy JVS. Zmenim typ vsech arealu v DB na "vodojem" migracnim SQL.

2. **Popupy v clusterovanych markerech nemaji rychle akce** -- aktualne clusterovane markery pouzivaji prosty HTML string bez tlacitek "Navigovat", "Pridat do trasy" atd. Popupy musi obsahovat tyto akce. Protoze React JSX nelze pouzit v Leaflet clusterech (viz omezeni produkce), vytvori se popup jako HTML s inline `onclick` handlery pro navigaci a pridani do trasy.

3. **Debounce na cluster prepocet** -- pri kazdem `zoomend`/`moveend` se okamzite prepocita clustering, coz zpusobuje zakysy. Pridani debounce (150ms) do `MarkerClusterGroup.tsx`.

4. **touch-action: manipulation na markery** -- eliminace 300ms delay na dotykovych zarizenich pridanim CSS pravidla pro `.custom-area-marker`, `.custom-cluster-marker` a `.custom-stop-marker`.

5. **Dashboard nazev** -- overit, ze "e-ManuAI . by . Dominik Schmied" je spravne zobrazeny (uz je implementovano).

---

## Technicke detaily

### 1. Migrace databaze -- zmena typu vsech arealu na "vodojem"

```sql
UPDATE arealy SET typ = 'vodojem' WHERE typ != 'vodojem';
```

### 2. Bohatsi popupy v MarkerClusterGroup

Soubor: `src/components/map/AreasMap.tsx`

- Rozsirit `popupHtml` o tlacitka: "Navigovat" (otevre Google Maps), "Pridat do trasy" / "Odebrat z trasy"
- Pouzit globalni funkci `window.__mapNavigate(lat, lng)` a `window.__mapToggleRoute(id)` registrovanou v AreasMap komponente
- Pridat kategorii, oploceni, poznamky do popupu

### 3. Debounce v MarkerClusterGroup

Soubor: `src/components/map/MarkerClusterGroup.tsx`

- Obalit `updateClusters` do debounce (150ms) pomoci `setTimeout`/`clearTimeout`
- Prvni volani bez debounce (immediate), nasledne debounced

### 4. Touch-action CSS

Soubor: `src/styles/industrial.css`

```css
.custom-area-marker,
.custom-cluster-marker,
.custom-stop-marker {
  touch-action: manipulation;
}
```

### 5. Poradi implementace

1. DB migrace (zmena typu arealu)
2. CSS touch-action
3. Debounce v MarkerClusterGroup
4. Rozsireni popupu v AreasMap

### Soubory k uprave
- `src/components/map/AreasMap.tsx` -- rozsireni popupu
- `src/components/map/MarkerClusterGroup.tsx` -- debounce
- `src/styles/industrial.css` -- touch-action
- DB migrace -- UPDATE arealy typ
