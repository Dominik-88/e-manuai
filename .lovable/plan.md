

# Migrace telemetrie: Socket.IO --> Supabase Realtime + DB tabulka

## Problem

Socket.IO klient (`barbieri-socket.ts`) se nikdy nepripoji k robotu z Lovable prostredi -- Lovable neposkytuje socket endpoint. Aktualne aplikace vzdy padne do mock rezimu s nahodnymi daty. To je slepa ulicka.

## Reseni: Supabase Realtime

Vytvorime tabulku `telemetrie_stroje` v databazi, kam bude externi system (robot/PLC/ingest API) zapisovat aktualni stav stroje. Frontend se prihlasi k odberu zmen pres Supabase Realtime (`postgres_changes`) a dostane PUSH aktualizace okamzite.

```text
[ Stroj / PLC / ECU ]
        |
        v
[ Ingest API (edge function) ]   <-- REST endpoint pro stroj
        |
        v
[ DB: telemetrie_stroje ]        <-- upsert radek
        |
        v (Supabase Realtime)
[ Frontend: TelemetryLive ]      <-- automaticky update
```

## 1. Databazova migrace -- nova tabulka `telemetrie_stroje`

```sql
CREATE TABLE telemetrie_stroje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stroj_id uuid NOT NULL REFERENCES stroje(id),
  rtk_status text DEFAULT 'neznámý',
  speed numeric DEFAULT 0,
  latitude numeric,
  longitude numeric,
  battery_level integer,
  mode text DEFAULT 'idle',
  s_mode integer,
  mth numeric DEFAULT 0,
  hdop numeric,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE telemetrie_stroje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON telemetrie_stroje
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role write" ON telemetrie_stroje
  FOR ALL TO service_role USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE telemetrie_stroje;
```

Kazdy stroj bude mit 1 radek. Externi system (nebo edge function) provadi UPSERT.

## 2. Edge function `ingest-telemetry`

REST endpoint pro prijem telemetrie ze stroje:

- `POST /ingest-telemetry` s JSON payloadem (rtk, speed, lat, lng, mth, mode, battery...)
- Autorizace pres API key (service_role nebo vlastni secret)
- Provede UPSERT do `telemetrie_stroje` (ON CONFLICT stroj_id)
- Odpovi `200 OK`

Toto je bod, kam robot/PLC/MQTT bridge posila data.

## 3. Prepis `barbieri-socket.ts` --> `barbieri-realtime.ts`

Kompletni nahrada Socket.IO klienta za Supabase Realtime:

- Subscribne na `postgres_changes` pro tabulku `telemetrie_stroje`
- Pri kazde zmene emituje `TelemetryData` do listeneru
- Zachova rozhrani `TelemetryData`, `ConnectionState`, `onTelemetry()`, `onConnectionChange()`
- Odstrani zavislost na `socket.io-client`
- Pokud v tabulce neni zadny radek, zobrazi "Cekani na data ze stroje"
- Emergency stop: zavola edge function nebo RPC

## 4. Uprava `useBarbieriiClient.ts`

- Import z `barbieri-realtime.ts` misto `barbieri-socket.ts`
- Rozhrani hook zustavaji stejna (telemetry, connectionState, connect, disconnect, emergencyStop)

## 5. Uprava `TelemetryLive.tsx`

- Odebrani "Demo rezim" textu
- Zmena textu "Pripojte se k Wi-Fi robota" na "Cekani na data ze stroje"
- Ostatni UI zustava stejna (RTK, rychlost, GPS, baterie, rezim, nouzove zastaveni)

## 6. Odstraneni `socket.io-client`

- Odebrani importu `socket.io-client` z package.json (uz nebude potreba)

## 7. Uprava UI dle BHV dashboardu (reference)

Na zaklade screenshotu oficialni BHV aplikace -- inspirace pro styling:
- Modre akcni tlacitka (uz mame primary = blue)
- Sekce: Cutting width, Work vel, Mode, Reverse only, Advanced Properties
- Dialogy pro: Power Management, SIM APN, Ntrip, Antenna Manager
- Tyto dialogy nebudeme implementovat ted (vyzaduji primo pripojeni ke stroji), ale pripravime strukturu pro budouci rozsireni

## Soubory k uprave

| Soubor | Akce |
|--------|------|
| `supabase/migrations/...` | Nova tabulka + RLS + realtime |
| `supabase/functions/ingest-telemetry/index.ts` | Novy edge function |
| `src/lib/barbieri-realtime.ts` | Novy soubor (nahradi barbieri-socket.ts) |
| `src/lib/barbieri-socket.ts` | Smazat |
| `src/hooks/useBarbieriiClient.ts` | Prepojit na novy modul |
| `src/components/dashboard/TelemetryLive.tsx` | Drobne textove zmeny |
| `package.json` | Odebrat socket.io-client |

## Co to neovlivni

- Vsechny ostatni casti aplikace (servis, arealy, mapa, MTH display) zustavaji beze zmen
- Hook `useMachine` zustava nezmeneny
- `MowingSessionRecorder` funguje nezavisle (pouziva GPS prohlizece)

