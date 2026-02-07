

# Oprava chyb a vylepseni -- mapa, mazani servisu, Manual, AI Asistent, iOS Safari

## Prehled

Plan pokryva 5 oblasti: (1) overeni a opravy mapy/planovace tras, (2) marker clustering, (3) redesign stranek Manual a AI Asistent, (4) oprava mazani servisnich zaznamu, (5) kompatibilita s iOS Safari.

---

## 1. Oprava mazani servisnich zaznamu

**Problem:**
Kod v `ServiceDetailPage.tsx` pouziva `JSON.stringify(service)` pro parametry `_puvodni_data` a `_nova_data` pri volani RPC `insert_audit_log`. To vytvari textovy retezec misto JSON objektu, coz zpusobi chybu pri volani databaze. Take je mozne, ze uzivatel nema roli admin/technik a tudiz nemuze provest UPDATE (soft-delete).

**Reseni:**
- Opravit volani `supabase.rpc('insert_audit_log', ...)` -- predat objekt primo, ne `JSON.stringify(...)`:
  ```typescript
  // PRED (chybne):
  _puvodni_data: JSON.stringify(service),
  // PO (spravne):
  _puvodni_data: service,
  ```
- Opravit obe mista: v `handleSave` (line 149-150) i v `handleDelete` (line 188)
- Pridat hromadne mazani na stranku `ServicePage.tsx`:
  - Checkbox u kazdeho zaznamu
  - Toolbar s poctem vybranych a tlacitkem "Smazat vybrane"
  - Dialog pro zadani duvodu smazani (spolecny pro vsechny)
  - Iterace pres vybrane zaznamy s volanim soft-delete a audit logu

**Soubory:**
- `src/pages/ServiceDetailPage.tsx` -- oprava JSON.stringify
- `src/pages/ServicePage.tsx` -- pridani hromadneho mazani

---

## 2. Marker clustering na mape

**Reseni:**
- Implementace vlastniho clusteringu bez externi knihovny (react-leaflet-markercluster ma problemy s React 18)
- Vytvoreni komponenty `MarkerClusterGroup.tsx` ktera pouziva Leaflet `L.markerClusterGroup` primo
- Alternativne: jednodussi pristup s `leaflet.markercluster` CSS + JS importem a custom wrapper komponentou
- Seskupovani blizkych bodu pri oddaleni, rozbalovani pri priblizeni
- Cluster ikona zobrazuje pocet bodu v kruhu

**Soubory:**
- `src/components/map/MarkerClusterGroup.tsx` -- novy soubor
- `src/components/map/AreasMap.tsx` -- integrace clusteringu
- `src/styles/industrial.css` -- styly pro cluster ikony

---

## 3. Vylepseni stranky Manual

**Zmeny:**
- Profesionalnejsi hlavicka s ikonou a popisem
- Vizualne odlisene sekce -- ikony u kapitol, barevne rozliseni typu obsahu
- Formtovany obsah -- nahradit `<pre>` za strukturovany HTML s odrázkami, zvyraznenim a rozbalitelnymi bloky
- Lepsi mobilni navigace -- bottom sheet misto skryteho panelu
- Vyhledavani s zvyraznenym vysledkem (highlight matching text)
- Breadcrumb navigace (Obsah > Kapitola > Sekce)

**Soubory:**
- `src/pages/ManualPage.tsx` -- kompletni redesign

---

## 4. Vylepseni stranky AI Asistent

**Zmeny:**
- Hlavicka s informaci o kontextu (pripojeny stroj, aktualni MTH)
- Nabidka predpripravenych dotazu (quick prompts) -- "Kdy je dalsi servis?", "Jak nastavit RTK?", atd.
- Markdown rendering odpovedi (tucne, seznamy, kod)
- Lepsi vizualni odliseni zprav -- gradient pozadi, casova znacka
- Typing indikator s animaci tri tecek misto spinneru
- Plynulejsi scroll k posledni zprave

**Soubory:**
- `src/pages/AssistantPage.tsx` -- redesign

---

## 5. iOS Safari kompatibilita

**Problemy k reseni:**
- `100vh` na iOS Safari nezohlednuje adresni radek -- nahradit za `100dvh` vsude
- `-webkit-backdrop-filter` uz je deklarovan v BottomNav, overit vsude
- `scrollbar` CSS pseudo-elementy nefunguji v Safari -- pridat `-webkit-` prefix a fallbacky
- `touch-action: manipulation` pro eliminaci 300ms delay na double-tap
- `env(safe-area-inset-bottom)` pro notch zarizeni -- uz castecne implementovano
- Date input (`type="date"`) ma na iOS odlisny vzhled -- pridat `-webkit-appearance: none` a vlastni styling
- `position: sticky` problemy v Safari -- overit `sticky-submit` tridu
- PWA manifest CORS chyba (viditelna v konzoli) -- opravit cestu k `manifest.json`

**Soubory:**
- `src/styles/industrial.css` -- Safari-specificke opravy
- `src/components/layout/BottomNav.tsx` -- overeni safe-area
- `src/components/layout/AppLayout.tsx` -- viewport fixes
- `index.html` -- manifest link oprava
- Formularove stranky -- date input styling

---

## Technicke detaily

### Poradi implementace
1. Oprava mazani servisu (kriticka chyba)
2. iOS Safari kompatibilita (siroka oprava)
3. Marker clustering
4. Manual redesign
5. AI Asistent redesign

### Zavislosti
- `leaflet.markercluster` (CSS/JS) pro clustering -- nebo vlastni implementace
- Zadne dalsi nove zavislosti

### Rizika
- Leaflet markercluster muze vyzadovat specificke peer dependency verze -- bude nutne otestovat
- OSRM demo server ma rate limiting -- stavajici cache v `routing.ts` to resi
- iOS Safari testovani vyzaduje realne zarizeni nebo simulátor

