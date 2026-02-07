# Deployment Guide - e-ManuAI v2.0

## 🚀 Nové funkce v této verzi

### 1. **Telemetrie Bridge System**
- Automatické ukládání telemetrie z Barbieri API do Supabase
- Historie GPS pozic, RTK statusu, diagnostiky
- Realtime synchronizace každých 5 sekund

### 2. **Realtime Live Tracking Mapa**
- Live pozice stroje na mapě
- Trail (cesta stroje) za poslední hodinu
- Barevné indikátory RTK statusu (FIX/FLOAT/NONE)
- Realtime updates přes Supabase Realtime

### 3. **Inteligentní servisní systém**
- Automatické sledování servisních intervalů
- Upozornění na blížící se servisy
- Detekce servisů po termínu
- Detailní přehled všech intervalů

## 📋 Kroky nasazení

### Krok 1: Databázové migrace (KRITICKÉ!)

Musíš spustit SQL migrace v Supabase Dashboard:

1. **Otevři Supabase Dashboard**: https://supabase.com/dashboard
2. **Vyber projekt**: e-manuai
3. **Přejdi na SQL Editor**
4. **Spusť migrace v tomto pořadí:**

#### Migrace 1: Telemetrie systém
```bash
# Soubor: supabase/migrations/20260207_telemetry_system.sql
```

Tato migrace vytvoří:
- ✅ Tabulku `telemetrie_log`
- ✅ RLS policies
- ✅ Realtime publikaci
- ✅ Funkce `get_latest_telemetry()`
- ✅ Funkce `get_telemetry_trail()`
- ✅ View `v_stroje_live_status`

#### Migrace 2: Servisní intervaly
```bash
# Soubor: supabase/migrations/20260207_service_intervals.sql
```

Tato migrace vytvoří:
- ✅ Tabulku `service_intervals`
- ✅ Seed data s autentickými intervaly
- ✅ View `v_service_status`
- ✅ Funkce `get_next_service()`
- ✅ Funkce `count_overdue_services()`

### Krok 2: Ověření migrací

Po spuštění migrací ověř, že vše funguje:

```sql
-- 1. Zkontroluj, že tabulky existují
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('telemetrie_log', 'service_intervals');

-- 2. Zkontroluj seed data
SELECT * FROM service_intervals;

-- 3. Zkontroluj RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('telemetrie_log', 'service_intervals');

-- 4. Zkontroluj Realtime publikaci
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### Krok 3: Frontend deployment

Frontend se automaticky nasadí přes Lovable:

1. **Push do GitHubu** - už hotovo ✅
2. **Lovable auto-deploy** - detekuje změny a buildne
3. **Ověř live URL**: https://e-manuai.lovable.app/

### Krok 4: Testování

#### Test 1: Telemetrie sync
```typescript
// V browser console na https://e-manuai.lovable.app/
// Zkontroluj, že sync běží:
console.log('Telemetry sync active:', 
  window.localStorage.getItem('telemetry-sync-active')
);
```

#### Test 2: Realtime mapa
1. Otevři Dashboard
2. Scroll dolů k "Live Tracking"
3. Měl bys vidět mapu s aktuální pozicí
4. Pokud je stroj online, měl bys vidět "LIVE" indikátor

#### Test 3: Servisní stav
1. Otevři Dashboard
2. Najdi "Servisní stav" kartu
3. Měl bys vidět nejbližší servis a zbývající MTH
4. Klikni na "Zobrazit všechny intervaly"

### Krok 5: Monitoring

#### Supabase Dashboard
- **Database > Tables**: Zkontroluj `telemetrie_log` - měly by přibývat záznamy
- **Database > Realtime**: Zkontroluj aktivní subscriptions
- **Logs**: Sleduj případné chyby

#### Browser DevTools
```javascript
// Zkontroluj Realtime subscription
supabase.getChannels(); // Měl bys vidět 'telemetry-{strojId}'

// Zkontroluj telemetry sync
import { getGlobalTelemetrySync } from '@/lib/telemetry-sync';
const sync = getGlobalTelemetrySync();
console.log('Last sync:', sync?.getLastSyncTime());
console.log('Is active:', sync?.isActive());
```

## 🔧 Konfigurace

### Environment Variables

Ujisti se, že máš správně nastavené:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Barbieri API

Telemetrie sync očekává Barbieri API na:
```
http://192.168.4.1:5000/api/telemetry
```

Pokud je API na jiné adrese, uprav v `src/lib/telemetry-sync.ts`:
```typescript
const BARBIERI_API_URL = 'http://your-barbieri-ip:port';
```

## 🐛 Troubleshooting

### Problém: Mapa se nenačítá

**Řešení:**
1. Zkontroluj, že migrace `20260207_telemetry_system.sql` proběhla
2. Zkontroluj browser console pro chyby
3. Ověř, že Realtime je povoleno v Supabase

### Problém: Telemetrie se neukládá

**Řešení:**
1. Zkontroluj, že Barbieri API běží na `http://192.168.4.1:5000`
2. Zkontroluj browser console - měl bys vidět "✅ Telemetry synced"
3. Zkontroluj Supabase logs pro RLS policy errors

### Problém: Servisní intervaly se nezobrazují

**Řešení:**
1. Zkontroluj, že migrace `20260207_service_intervals.sql` proběhla
2. Zkontroluj seed data: `SELECT * FROM service_intervals;`
3. Zkontroluj view: `SELECT * FROM v_service_status;`

### Problém: Realtime nefunguje

**Řešení:**
1. Zkontroluj Supabase Dashboard > Database > Replication
2. Ověř, že `telemetrie_log` je v publikaci:
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename = 'telemetrie_log';
   ```
3. Restartuj Realtime server v Supabase Dashboard

## 📊 Očekávané výsledky

Po úspěšném nasazení:

✅ **Dashboard zobrazuje:**
- Live tracking mapu s aktuální pozicí
- Servisní stav s nejbližším servisem
- Trail (cesta stroje) za poslední hodinu
- Realtime updates každých 5 sekund

✅ **Databáze obsahuje:**
- Telemetrické záznamy v `telemetrie_log`
- Servisní intervaly v `service_intervals`
- View `v_service_status` s aktuálním stavem
- View `v_stroje_live_status` s live daty

✅ **Realtime funguje:**
- Mapa se aktualizuje automaticky
- Nové telemetrické body se zobrazují okamžitě
- Trail se prodlužuje v reálném čase

## 🎯 Performance

### Očekávaná zátěž

- **Telemetrie sync**: 1 request každých 5s = 720 requests/hod
- **Realtime subscriptions**: 1 aktivní connection per uživatel
- **Database writes**: ~720 záznamů/hod do `telemetrie_log`

### Optimalizace

1. **Retention policy**: Automatické mazání telemetrie starší než 30 dní
2. **Indexy**: Optimalizované pro rychlé dotazy
3. **RLS**: Minimální overhead díky jednoduchým policies

## 📞 Podpora

Pokud narazíš na problémy:

1. **Zkontroluj CHANGELOG.md** - možná už je řešení
2. **Zkontroluj TECHNICAL.md** - detailní technická dokumentace
3. **Zkontroluj browser console** - většina chyb je tam vidět
4. **Zkontroluj Supabase logs** - backend chyby

---

**Úspěšné nasazení! 🎉**

Aplikace je nyní vybavena:
- ✅ Realtime live tracking
- ✅ Inteligentní servisní systém
- ✅ Telemetrie bridge
- ✅ Historie GPS pozic
- ✅ Automatické upozornění na servisy

**Verze**: 2.0.0  
**Datum**: 7. února 2026  
**Autor**: Dominik Schmied + Bhindi AI
