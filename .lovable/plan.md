

# 📱 PWA Aplikace Barbieri XRot 95 EVO
## Kompletní plán implementace

---

## 🎯 Přehled projektu

Plnohodnotná Progressive Web App pro autonomní sekačku Barbieri XRot 95 EVO sloužící jako:
- Interaktivní technický manuál
- Digitální servisní knížka s audit trail
- Provozní deník
- Telemetrický nástroj
- AI asistent specializovaný na stroj

---

## 🏗️ Fáze 1: Základy a infrastruktura

### Backend (Lovable Cloud + Supabase)
- **Autentizace**: Přihlášení emailem s možností rozšíření o Google OAuth
- **Databáze**: 7 hlavních tabulek
  - `profiles` - uživatelské profily
  - `user_roles` - role (admin, technik, operátor)
  - `stroje` - evidence strojů
  - `arealy` - 42 reálných vodárenských lokalit s GPS
  - `servisni_zaznamy` - digitální servisní knížka
  - `provozni_zaznamy` - provozní deník
  - `audit_log` - kompletní historie změn
- **RLS politiky**: Přístupy dle rolí uživatelů
- **Edge Functions**: AI asistent přes Lovable AI Gateway

### PWA konfigurace
- Service Worker pro offline funkcionalitu
- Manifest pro instalaci na zařízení
- IndexedDB pro lokální cache a offline zápis
- Automatická synchronizace při obnovení připojení

---

## 🎨 Fáze 2: Design systém

### Industriální/technický vzhled
- **Barevná paleta**:
  - Primární: Tmavě šedá (#1a1a2e), ocelová modrá (#16213e)
  - Akcenty: Signální zelená (#00d26a), varovná oranžová (#ff8c00), kritická červená (#ff3d3d)
  - Pozadí: Tmavá (#0f0f23), karty (#1a1a2e)
- **Typografie**: Roboto Mono pro technická data, Inter pro texty
- **Komponenty**: Ocelové rámečky, LED indikátory, dashboard widgety

### Terénní optimalizace
- Velikost dotyků min. 56px (pro rukavice)
- Vysoký kontrast pro slunce (7:1 WCAG AAA)
- Velké fonty pro MTH displeje (40px)
- Sticky navigace vždy viditelná

---

## 📖 Fáze 3: Digitální manuál

### Obsah (z autentických zdrojů)
- 7 hlavních kapitol dle specifikace
- Příprava stroje, ovládání, technické specifikace
- Údržba a servis, autonomní navigace (RTK)
- Bezpečnostní systémy

### Funkce
- Stromová navigace s rozbalovacími sekcemi
- Fulltextové vyhledávání (výsledky do 300ms)
- Breadcrumb navigace
- Offline přístup ke všem kapitolám
- Zvýrazňování hledaných výrazů

---

## 🔧 Fáze 4: Servisní knížka

### Evidence servisů
- Formulář pro nový záznam s validací
- Povinná pole: datum, MTH, typ zásahu, popis (min 10 znaků), technik
- Volitelná pole: firma, areál, náklady
- Validace: datum ne v budoucnu, MTH ≥ poslední servis

### Historie a audit
- Seznam servisů s filtry (typ, datum, technik, areál)
- Detail záznamu s možností editace
- Historie změn (kdo, kdy, co změnil, důvod)
- Export do PDF a Excel
- Soft delete se záznamem důvodu

---

## ⏱️ Fáze 5: Servisní intervaly

### Definované intervaly (autentická data)
- **Výměna oleje**: 50 mth (první), pak 100 mth - KRITICKÉ
- **Kontrola nožů**: 50 mth - DŮLEŽITÉ
- **Velký servis**: 500 mth - KRITICKÉ

### Funkce
- Dashboard s přehledem všech intervalů
- Automatický výpočet zbývajících MTH
- Barevná indikace stavu (zelená/oranžová/červená)
- Notifikace při blížícím se termínu (<20 mth)
- Možnost manuální korekce s audit logem

---

## 📍 Fáze 6: Evidence areálů

### Reálná data (42 vodárenských objektů)
- Předvyplněno 42 lokalit z JVS seznamu
- GPS souřadnice, rozměry ploch, délka oplocení
- Okresy: Písek, Strakonice, České Budějovice, Prachatice, Český Krumlov, Tábor

### Funkce
- Seznam areálů s vyhledáváním a filtry
- Detail s mapou (OpenStreetMap/Google Maps)
- Přidání nového areálu s GPS výběrem na mapě
- Vazba areál ↔ stroj ↔ servis
- Statistiky odpracovaných MTH na areál
- Export GPX pro navigaci

---

## 📊 Fáze 7: Telemetrie

### Manuální zadávání (bez API výrobce)
- Formulář pro záznam provozních dat
- Pole: MTH, režim, S-Mode, areál, RTK stav, poznámky
- Připravená struktura pro budoucí API integraci

### Dashboard
- Přehled aktuálního stavu stroje
- Graf odpracovaných MTH za období
- Historie prací podle areálů
- Upozornění na změny RTK stavu
- Vizuální indikace "API není k dispozici"

---

## 🤖 Fáze 8: AI asistent

### Integrace přes Lovable AI
- Edge function volající Lovable AI Gateway
- Model: google/gemini-3-flash-preview
- Streaming odpovědí pro plynulý UX

### Knowledge base
- Kompletní technická dokumentace stroje
- Aktuální stav stroje a MTH
- Historie servisů a problémů
- Seznam areálů s GPS
- RTK specifikace (u-blox ZED-F9P, CZEPOS)

### Chování AI
- Kontextuální odpovědi s daty ze stroje
- Odkazy na relevantní kapitoly manuálu
- Servisní doporučení na základě MTH
- Diagnostické návrhy s kroky řešení
- Markdown rendering odpovědí

---

## 📱 Fáze 9: UX pro terén

### Navigace
- Spodní navigační lišta (5 ikon)
- Sticky header s MTH a upozorněními
- Floating action button pro rychlý zápis
- Max 3 kliky k jakékoliv funkci

### Offline indikátory
- Status připojení v headeru
- Počet čekajících synchronizací
- Využití offline cache
- Automatická sync při obnovení

### Notifikace
- Push notifikace pro blížící se servisy
- In-app upozornění na kritické stavy
- Toast notifikace pro potvrzení akcí

---

## 🔐 Bezpečnost a data

### Autentizace a role
- Email přihlášení s možností OAuth
- Role: Admin, Technik, Operátor
- RLS politiky dle rolí

### Audit trail
- Logování všech změn
- Kdo, kdy, co změnil, původní hodnota
- Důvod změny (povinný při editaci/smazání)

### Offline-first
- IndexedDB pro lokální data
- Service Worker cache pro statické soubory
- Konflikt resolution při synchronizaci

---

## 📋 Výstup implementace

Po dokončení bude aplikace obsahovat:
- ✅ Plně funkční PWA instalovatelnou na všechna zařízení
- ✅ 42 předvyplněných areálů s GPS
- ✅ Kompletní digitální manuál stroje
- ✅ Digitální servisní knížku s historií
- ✅ Sledování servisních intervalů
- ✅ Provozní deník s telemetrií
- ✅ AI asistent specializovaný na Barbieri XRot 95 EVO
- ✅ Offline funkcionalitu pro práci v terénu
- ✅ Industriální design optimalizovaný pro terén

