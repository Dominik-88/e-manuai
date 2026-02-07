
# Opravy mapy, markeru, FAB tlacitka a brandingu

## Prehled
Reseni 5 konkretnich problemu nahlasenych uzivatelem:

1. **Mapa neni cerna** -- zmena z CartoDB Dark Matter na svetlejsi podklad (CartoDB Voyager) pro lepsi citelnost
2. **Mapove body prilis robustni** -- zmenseni markeru z 36-40px na 24-28px, tenci ramecky, jemnejsi stiny
3. **Mapa mala** -- zvetseni vysky mapy z 480px na 70vh (min 500px) pro fullscreen-like pocit
4. **FAB tlacitko "+" uprostred** -- presunuti z `right-4` na `right-4 bottom-safe` a zaroven posun vice ke kraji, aby neprekrylo obsah
5. **Nazev na Dashboardu** -- pridani titulku "e-ManuAI • by • Dominik Schmied" na Dashboard stranku

## Technicke detaily

### Soubory k uprave:

1. **`src/components/map/AreasMap.tsx`**
   - Zmena TileLayer URL z `dark_all` na `rastertiles/voyager` (svetlejsi mapa)
   - Zmena vysky mapy z `480px` na `70vh` s `minHeight: 500px`

2. **`src/components/map/AreaMarkerIcon.tsx`**
   - Zmenseni `size` z 36/40 na 24/28
   - Ztenčeni border z 3px na 2px
   - Zmenseni box-shadow a font-size
   - Zmenseni stop markeru z 38px na 26px

3. **`src/components/layout/FloatingActionButton.tsx`**
   - Zmena pozice: presun dale ke kraji (`right-6`) -- nebo ponechat `right-4` ale zajistit ze neni uprostred viewportu

4. **`src/pages/DashboardPage.tsx`**
   - Pridani nadpisu "e-ManuAI • by • Dominik Schmied" jako hero sekce pred MthDisplay

5. **`src/components/map/MarkerClusterGroup.tsx`**
   - Zmenseni cluster ikon (36/42/48 -> 30/36/40)
