# Release Notes - e-ManuAI v2.0

## 🎉 Hlavní novinky

### 🗺️ **Realtime Live Tracking**
Sledujte pozici vašeho stroje v reálném čase na interaktivní mapě!

**Funkce:**
- ✅ Live pozice s GPS souřadnicemi
- ✅ Trail (cesta stroje) za poslední hodinu
- ✅ Barevné indikátory RTK statusu:
  - 🟢 **Zelená** = RTK FIX (přesnost 1-3 cm)
  - 🟠 **Oranžová** = RTK FLOAT (přesnost ~1 m)
  - 🔴 **Červená** = Bez RTK korekce
- ✅ Realtime updates každých 5 sekund
- ✅ Detailní popup s telemetrií (rychlost, baterie, teplota, MTH)
- ✅ Automatické centrum mapy (volitelné)

**Kde najdete:**
Dashboard → Live Tracking sekce

---

### 🔧 **Inteligentní servisní systém**
Nikdy nezapomeňte na servis! Automatické sledování a upozornění.

**Funkce:**
- ✅ Automatické sledování 8 servisních intervalů:
  - Výměna motorového oleje (50/100 MTH)
  - Kontrola nožů (50 MTH)
  - Velký servis (500 MTH)
  - Kontrola řemenů (200 MTH)
  - Vzduchový filtr (100 MTH)
  - Mazání ložisek (100 MTH)
  - Kontrola pneumatik (50 MTH)
  - Kontrola RTK antény (200 MTH)
- ✅ Vizuální indikátory:
  - 🔴 **Červená** = Servis po termínu
  - 🟠 **Oranžová** = Servis se blíží (do 10 MTH)
  - 🟢 **Zelená** = Vše v pořádku
- ✅ Progress bar s přesným zbytkem MTH
- ✅ Historie servisů s datumy
- ✅ Detailní přehled všech intervalů

**Kde najdete:**
Dashboard → Servisní stav karta

---

### 📡 **Telemetrie Bridge System**
Automatické ukládání telemetrie do databáze pro historii a analytics.

**Funkce:**
- ✅ Automatická synchronizace každých 5 sekund
- ✅ Ukládání GPS pozic, RTK statusu, diagnostiky
- ✅ Historie telemetrie za posledních 30 dní
- ✅ Realtime updates přes Supabase Realtime
- ✅ Automatická aktualizace MTH
- ✅ Retry logika při výpadku spojení

**Technické detaily:**
- Fetch z Barbieri API: `http://192.168.4.1:5000/api/telemetry`
- Ukládání do Supabase: `telemetrie_log` tabulka
- Realtime publikace pro live updates

---

## 🆕 Nové komponenty

### `RealtimeMap.tsx`
Interaktivní mapa s live tracking a trail.

**Props:**
```typescript
{
  strojId: string;           // ID stroje
  height?: string;           // Výška mapy (default: 600px)
  showTrail?: boolean;       // Zobrazit trail (default: true)
  trailHours?: number;       // Hodin historie (default: 1)
  autoCenter?: boolean;      // Auto-center na stroj (default: false)
}
```

### `ServiceStatusCard.tsx`
Karta zobrazující servisní stav stroje.

**Props:**
```typescript
{
  strojId: string;           // ID stroje
  currentMth: number;        // Aktuální motohodiny
}
```

### `TelemetrySync` Service
Background service pro synchronizaci telemetrie.

**API:**
```typescript
const sync = new TelemetrySync(strojId);
sync.start();                          // Spustit sync
sync.stop();                           // Zastavit sync
sync.onError((error) => {...});        // Error callback
sync.onSuccess((data) => {...});       // Success callback
sync.getLastSyncTime();                // Čas poslední sync
sync.isActive();                       // Je aktivní?
```

---

## 🗄️ Databázové změny

### Nové tabulky

#### `telemetrie_log`
Ukládá telemetrická data z Barbieri API.

**Sloupce:**
- GPS: `gps_lat`, `gps_lng`, `gps_alt`
- RTK: `rtk_status`, `rtk_accuracy_cm`
- Motion: `speed_kmh`, `heading_deg`
- Power: `battery_voltage`, `battery_percentage`
- Diagnostics: `engine_temp_c`, `oil_pressure_bar`, `blade_rpm`
- MTH: `mth`
- Metadata: `timestamp`, `created_at`

**Indexy:**
- `idx_telemetrie_stroj_time` - rychlé dotazy pro stroj
- `idx_telemetrie_recent` - poslední 24h data

**RLS Policies:**
- ✅ SELECT: Všichni mohou číst
- ✅ INSERT: Pouze authenticated users
- ❌ UPDATE/DELETE: Zakázáno (immutable log)

#### `service_intervals`
Definice servisních intervalů.

**Sloupce:**
- `nazev` - Název servisu
- `interval_mth` - Interval v MTH
- `first_service_mth` - První servis (speciální případ)
- `kriticky` - Je kritický?
- `popis` - Popis servisu

**Seed data:**
8 přednastavených intervalů pro Barbieri XRot 95 EVO

### Nové views

#### `v_service_status`
Kompletní přehled servisního stavu všech strojů.

**Sloupce:**
- Základní info: `stroj_id`, `vyrobni_cislo`, `aktualni_mth`
- Servis: `service_name`, `interval_mth`, `next_service_mth`
- Stav: `remaining_mth`, `is_overdue`, `is_approaching`
- Historie: `last_service_mth`, `last_service_date`

#### `v_stroje_live_status`
Live status všech strojů s poslední telemetrií.

**Sloupce:**
- Stroj: `id`, `vyrobni_cislo`, `model`, `aktualni_mth`
- Telemetrie: `gps_lat`, `gps_lng`, `rtk_status`, `speed_kmh`, `battery_percentage`
- Status: `last_telemetry`, `seconds_since_last_signal`, `is_online`

### Nové funkce

#### `get_latest_telemetry(p_stroj_id UUID)`
Vrací poslední telemetrii pro daný stroj.

#### `get_telemetry_trail(p_stroj_id UUID, p_hours INTEGER, p_limit INTEGER)`
Vrací historii pozic pro zobrazení trasy.

#### `get_next_service(p_stroj_id UUID)`
Vrací nejbližší kritický servis.

#### `count_overdue_services(p_stroj_id UUID)`
Počet kritických servisů po termínu.

#### `cleanup_old_telemetry()`
Automatické čištění telemetrie starší než 30 dní.

---

## 🔧 Technické vylepšení

### Performance
- ✅ Optimalizované indexy pro rychlé dotazy
- ✅ Realtime subscription s minimal overhead
- ✅ Debouncing pro MTH sync (30s)
- ✅ Retry logika s exponential backoff

### Security
- ✅ RLS policies na všech tabulkách
- ✅ Immutable telemetry log (no UPDATE/DELETE)
- ✅ Authenticated-only writes
- ✅ Public reads pro dashboard

### Reliability
- ✅ Automatic retry při chybě (max 3x)
- ✅ Error callbacks pro monitoring
- ✅ Graceful degradation při offline
- ✅ Cleanup job pro staré data

---

## 📱 UX Vylepšení

### Dashboard
- ✅ Nová "Live Tracking" sekce s mapou
- ✅ Nová "Servisní stav" karta
- ✅ Lepší vizuální hierarchie
- ✅ Realtime updates bez refresh

### Accessibility
- ✅ ARIA labels pro všechny komponenty
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management

### Mobile
- ✅ Touch-optimized controls (44px targets)
- ✅ Responsive mapa
- ✅ Safe area support pro notched devices
- ✅ Optimalizované pro iOS Safari

---

## 🐛 Opravy

### Kritické
- ✅ Opravena MTH synchronizace
- ✅ Opraveno RLS pro telemetrii
- ✅ Opraveno Realtime subscription cleanup

### Menší
- ✅ Lepší error handling v telemetry sync
- ✅ Optimalizované SQL dotazy
- ✅ Opraveny TypeScript typy

---

## 📊 Statistiky

### Nový kód
- **7 nových souborů**
- **~2000 řádků kódu**
- **3 databázové migrace**
- **8 nových komponent/funkcí**

### Databáze
- **2 nové tabulky**
- **2 nové views**
- **6 nových funkcí**
- **8 seed záznamů**

### Dokumentace
- **ARCHITECTURE.md** - Technická architektura
- **DEPLOYMENT.md** - Deployment guide
- **CHANGELOG.md** - Historie změn
- **CONTRIBUTING.md** - Development guidelines
- **TECHNICAL.md** - Technická dokumentace

---

## 🚀 Migrace z v1.x

### Krok 1: Databáze
Spusť migrace v Supabase SQL Editor:
1. `20260207_telemetry_system.sql`
2. `20260207_service_intervals.sql`

### Krok 2: Frontend
Automaticky nasazeno přes Lovable CI/CD.

### Krok 3: Testování
Ověř funkčnost podle DEPLOYMENT.md.

---

## 🎯 Roadmap v2.1

### Plánované funkce
- [ ] Push notifikace pro servisy
- [ ] Export telemetrie do CSV/Excel
- [ ] Heatmapa pokrytí areálu
- [ ] Prediktivní údržba s AI
- [ ] Multi-stroj dashboard
- [ ] Offline mapa s cache

### Vylepšení
- [ ] Faster telemetry sync (2s interval)
- [ ] Longer trail history (24h)
- [ ] Custom service intervals
- [ ] Service reminders via email

---

## 📞 Podpora

**Dokumentace:**
- README.md - Základní info
- ARCHITECTURE.md - Architektura
- DEPLOYMENT.md - Nasazení
- TECHNICAL.md - Technické detaily

**Kontakt:**
- GitHub Issues pro bug reporty
- GitHub Discussions pro otázky

---

## 🙏 Poděkování

Děkujeme všem, kteří přispěli k této verzi!

**Speciální poděkování:**
- Barbieri za skvělé API
- Supabase za realtime infrastrukturu
- Leaflet za mapovou knihovnu

---

**Verze**: 2.0.0  
**Datum vydání**: 7. února 2026  
**Autor**: Dominik Schmied  
**AI Asistent**: Bhindi

**Užijte si nové funkce! 🎉**
