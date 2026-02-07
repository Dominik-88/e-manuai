

# Komplexni upgrade mapy, trasoveho planovace a celkoveho UX/UI

## Prehled

Kompletni redesign mapove komponenty, trasoveho planovace a vylepseni UX/UI vsech stranek aplikace. Hlavni zmeny: kresleni skutecnych tras na mape (ne vzdusnou carou), vizualne atraktivnejsi mapove body, moznost zrusit celou trasu jednim klikem, a globalni vylepseni rozlozeni, prehlednosti a ovladani vsech stranek.

---

## 1. Premium mapa s vlastnimi ikonami a stylem

**Co se zmeni:**
- Nahrazeni standardnich Leaflet markeru vlastnimi barevnymi SVG ikonami podle typu arealu (vodojem = modra kapka, vrt = hneda sipka dolu, park = zeleny strom atd.)
- Tmavsi mapovy podklad (CartoDB Dark Matter) ladici s industrialnim designem aplikace
- Pop-up okna s lepsim designem: zaoblene rohy, gradient pozadi, vetsi dotykove cile pro akce
- Pridani tlacitka "Centrovit mapu" a "Moje poloha" (GPS)
- Animovany prechod pri otevirani pop-upu
- Zobrazeni shlukovani markeru (marker clustering) kdyz jsou body blizko sebe

**Informace v pop-upu:**
- Nazev arealu + typ ikona
- Okres, plocha (m2/ha), obvod oploceni
- Kategorie travnate plochy
- Prirazeny stroj (pokud existuje)
- Poznamky (zkracene)
- Rychle akce: Navigovat, Pridat do trasy, Otevrit Google Maps, Zaznam provozu

## 2. Trasovy planovac s realnou trasou na mape

**Uplne novy trasovy planovac:**
- Mapa s vykreslenou trasou pomoci OSRM (Open Source Routing Machine) - skutecna silnicni trasa, ne vzdusna cara
- Pouziti bezplatneho OSRM demo serveru (`router.project-osrm.org/route/v1/driving/...`) pro ziskani geometrie trasy
- Ciselne oznaceni zastávek primo na mape (1, 2, 3...)
- Spojnice mezi body se barevne odlisuji podle poradi

**Ovladani:**
- Tlacitko "Pridat vse s GPS" pro hromadne pridani
- Tlacitko "Zrusit celou trasu" (cervene, s potvrzenim) -- smaze vsechny zastávky najednou
- Drag-and-drop razeni zastavek v seznamu
- Optimalizace poradi (stavajici nearest-neighbor TSP)
- Statisticky panel: pocet zastavek, celkova plocha, celkova vzdalenost po silnici, odhadovany cas jizdy
- Tlacitko "Navigovat v Google Maps" generuje URL se vsemi waypointy

**Integrace s mapou:**
- Kdyz je trasovy planovac aktivni, mapa se automaticky prepne do rezimu trasy
- Kliknuti na marker v mape prida/odebere areal z trasy
- Trasa se prekresluje v realnem case pri zmene poradi

## 3. Stranka Arealy -- redesign

**Zmeny v rozlozeni:**
- Prepinac seznam/mapa presunout nahoru vedle nadpisu (ne uprostred stranky)
- Souhrnne statistiky zobrazit jako kompaktni lištu pod nadpisem
- Filtry a vyhledavani sloučit do jednoho radku s kolapsibilnim filtrem
- Karty arealu: pridat barevny proužek vlevo podle typu, lepsi hierarchie informaci
- "Prazdny stav" s ilustraci misto velke ikony

**Rezim mapy:**
- Mapa zabere celou sirku a vysku (fullscreen-like) s floating ovladacimi prvky
- Trasovy planovac jako posuvny panel zdola (bottom sheet)

## 4. Dashboard -- vylepseni rozlozeni

**Zmeny:**
- MTH displej: pridat kruhovy progress ukazatel do dalsiho servisu
- Quick Actions: zmensit na 1 radek se scrollem (horizontalni scroll na mobilu)
- Servisni intervaly: pridat barevne kodovani naléhavosti (zelena/oranzova/cervena)
- Provozni statistiky a posledni zaznamy: sjednotit vizualni styl
- Telemetrie a Digital Twin: presunout do sklopitelnych sekci at nezahrnuji dashboard

## 5. Servisni knizka -- vylepseni

**Zmeny:**
- Tlacitko Filter: implementovat skutecny filtr (typ zasahu, datumovy rozsah) -- aktualne nefunkcni
- Karty zaznamu: pridat barevny indikator vlevo podle typu zasahu
- Pridani souhrnne statistiky nahore (celkem zaznamu, celkove naklady, posledni servis)
- Lepsi prazdny stav

## 6. Formulare (Novy servis, Novy areal, Novy provoz)

**Zmeny:**
- Seskupeni poli do logickych sekci s nadpisy (Zakladni udaje, GPS & lokace, Doplnujici info)
- Pridani vizualnich oddelovacu mezi sekcemi
- GPS pole: tlacitko "Pouzit moji polohu" pro automaticke vyplneni
- Lepsi validacni zpravy s ikonami
- Sticky submit tlacitko na mobilu (fixovane dole)

## 7. Globalni UI/UX vylepseni

**Navigace:**
- Bottom nav: pridat jemne animace pri prepinani (scale + fade)
- Aktivni polozka: vyraznejsi vizualni indikace (vyplnena ikona misto obrysove)

**Typografie a spacing:**
- Sjednotit velikosti nadpisu na vsech strankach
- Zvetsit mezery mezi sekcemi pro lepsi citelnost
- Strankove nadpisy: pridat popisnou ikonu

**Micro-interakce:**
- Skeleton loadery: animovany gradient misto staticke barvy (shimmer efekt)
- Karty: jemny hover efekt (lift + glow)
- Uspesne akce: animovany checkmark misto textoveho toastu

---

## Technicke detaily

### Nove soubory
1. `src/components/map/AreaMarkerIcon.tsx` -- vlastni SVG marker ikony podle typu arealu
2. `src/components/map/RoutePolyline.tsx` -- komponenta pro vykresleni trasy z OSRM dat
3. `src/components/map/MapControls.tsx` -- floating ovladaci prvky mapy (centrovani, GPS, zoom)
4. `src/components/map/AreaPopup.tsx` -- vyssi kvalita pop-up obsahu
5. `src/components/route/RouteMapView.tsx` -- integrovana mapa s trasou
6. `src/components/route/RouteBottomSheet.tsx` -- mobilni bottom sheet pro seznam zastavek
7. `src/lib/routing.ts` -- OSRM API volani a dekodovani polyline

### Upravene soubory
1. `src/components/map/AreasMap.tsx` -- kompletni redesign s novymi markery, tmavym podkladem, clusteringem
2. `src/components/route/RoutePlanner.tsx` -- kompletni redesign s integraci mapy a OSRM
3. `src/pages/AreasPage.tsx` -- redesign rozlozeni, integrace mapy a planovace
4. `src/pages/DashboardPage.tsx` -- reorganizace widgetu, progress ring pro MTH
5. `src/pages/ServicePage.tsx` -- pridani filtru, souhrnnych statistik
6. `src/pages/NewAreaPage.tsx` -- seskupeni poli, GPS tlacitko
7. `src/pages/NewServicePage.tsx` -- seskupeni poli, sticky submit
8. `src/pages/NewOperationPage.tsx` -- seskupeni poli, sticky submit
9. `src/pages/SettingsPage.tsx` -- vizualni vylepseni
10. `src/pages/ManualPage.tsx` -- lepsi mobilni navigace
11. `src/pages/AssistantPage.tsx` -- vizualni vylepseni chatu
12. `src/components/layout/BottomNav.tsx` -- animace, vyraznejsi aktivni stav
13. `src/components/layout/AppHeader.tsx` -- jemne vylepseni
14. `src/components/dashboard/QuickActionsCard.tsx` -- horizontalni scroll
15. `src/components/dashboard/MthDisplay.tsx` -- progress ring
16. `src/styles/industrial.css` -- nove utility tridy, shimmer efekt, hover glow

### Zavislosti
- `@changey/react-leaflet-markercluster` (nebo implementace vlastniho clusteringu)
- Pouziti polyline dekoderu pro OSRM odpovedi (vlastni implementace, ~20 radku)

### OSRM integrace
- Endpoint: `https://router.project-osrm.org/route/v1/driving/{coordinates}?overview=full&geometries=polyline`
- Bezplatny, bez API klice
- Fallback na vzdusne cary pokud OSRM nedostupny
- Cachovani tras v pameti pro opakované dotazy

