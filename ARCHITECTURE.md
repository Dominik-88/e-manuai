# Architektura e-ManuAI - Skutečný stav

## 🏗️ Aktuální architektura

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Barbieri XRot 95 EVO                      │
│                  (Fyzický stroj s PLC)                       │
│                                                              │
│  • Compass Servo Drive 2.0 (R54)                            │
│  • u-blox ZED-F9P GNSS                                      │
│  • LTE modem, Wi-Fi, Bluetooth                              │
│  • HTTP API: http://192.168.4.1:5000                        │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP API
┌─────────────────────────────────────────────────────────────┐
│              Frontend (React PWA)                            │
│                                                              │
│  useBarbieriiClient.ts → fetch telemetrie z Barbieri API    │
│  • GPS pozice, RTK status                                   │
│  • Rychlost, heading, baterie                               │
│  • Teplota motoru, tlak oleje                               │
└─────────────────────────────────────────────────────────────┘
                          ↓ Supabase Client
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                           │
│                                                              │
│  PostgreSQL Database:                                        │
│  • stroje (základní info, aktualni_mth)                     │
│  • servisni_zaznamy (servisní historie)                     │
│  • arealy (GPS souřadnice areálů)                           │
│  • sekaci_session (Digital Twin záznamy)                    │
│  • profiles (uživatelé, role)                               │
│                                                              │
│  Edge Functions:                                             │
│  • ai-assistant (OpenAI GPT-4)                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Databázové schéma (SKUTEČNÉ)

### Existující tabulky

#### `stroje`
```sql
CREATE TABLE stroje (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vyrobni_cislo TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  aktualni_mth INTEGER DEFAULT 0,
  stav TEXT CHECK (stav IN ('aktivní', 'servis', 'mimo provoz')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `servisni_zaznamy`
```sql
CREATE TABLE servisni_zaznamy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stroj_id UUID REFERENCES stroje(id) ON DELETE CASCADE,
  datum_servisu DATE NOT NULL,
  mth_pri_servisu INTEGER NOT NULL,
  typ_zasahu TEXT CHECK (typ_zasahu IN ('preventivní', 'oprava', 'porucha', 'jiné')),
  popis TEXT NOT NULL,
  provedl_osoba TEXT NOT NULL,
  naklady DECIMAL(10,2),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `arealy`
```sql
CREATE TABLE arealy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stroj_id UUID REFERENCES stroje(id) ON DELETE SET NULL,
  nazev TEXT NOT NULL,
  typ TEXT CHECK (typ IN ('fotbal', 'golf', 'park', 'zahrada', 'jiné')),
  okres TEXT,
  plocha_m2 INTEGER,
  obvod_oploceni_m INTEGER,
  kategorie_travnate_plochy TEXT,
  gps_latitude DECIMAL(10,7),
  gps_longitude DECIMAL(10,7),
  poznamky TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sekaci_session`
```sql
CREATE TABLE sekaci_session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stroj_id UUID REFERENCES stroje(id) ON DELETE CASCADE,
  areal_id UUID REFERENCES arealy(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  start_mth INTEGER NOT NULL,
  end_mth INTEGER,
  duration_minutes INTEGER,
  area_covered_m2 INTEGER,
  avg_speed_kmh DECIMAL(5,2),
  fuel_consumed_l DECIMAL(6,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔌 Barbieri API Integration

### Aktuální implementace

```typescript
// src/hooks/useBarbieriiClient.ts
const BARBIERI_API_URL = 'http://192.168.4.1:5000';

interface BarbieriiTelemetry {
  gps: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  rtk: {
    status: 'FIX' | 'FLOAT' | 'NONE';
    accuracy_cm: number;
  };
  motion: {
    speed_kmh: number;
    heading_deg: number;
  };
  power: {
    battery_voltage: number;
    battery_percentage: number;
  };
  diagnostics: {
    engine_temp_c: number;
    oil_pressure_bar: number;
    blade_rpm: number;
  };
  mth: number;
  timestamp: string;
}
```

### Problém: Telemetrie NENÍ v Supabase

**Aktuální stav:**
- ✅ Telemetrie přichází z Barbieri API (HTTP polling)
- ❌ Telemetrie NENÍ ukládána do Supabase
- ❌ Není Realtime subscription
- ❌ Není historie telemetrie

**Důsledky:**
- Nelze zobrazit historii pohybu
- Nelze offline přístup k telemetrii
- Nelze analytics na telemetrických datech

## 🎯 CO SKUTEČNĚ CHYBÍ

### 1. **Telemetrie Bridge** (PRIORITA 1)

Potřebujeme ukládat telemetrii z Barbieri API do Supabase:

```sql
-- NOVÁ TABULKA
CREATE TABLE telemetrie_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stroj_id UUID REFERENCES stroje(id) ON DELETE CASCADE,
  
  -- GPS & RTK
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  gps_alt DECIMAL(8, 2),
  rtk_status TEXT CHECK (rtk_status IN ('FIX', 'FLOAT', 'NONE')),
  rtk_accuracy_cm INTEGER,
  
  -- Motion
  speed_kmh DECIMAL(5, 2),
  heading_deg DECIMAL(5, 2),
  
  -- Power
  battery_voltage DECIMAL(5, 2),
  battery_percentage INTEGER CHECK (battery_percentage BETWEEN 0 AND 100),
  
  -- Diagnostics
  engine_temp_c DECIMAL(5, 2),
  oil_pressure_bar DECIMAL(5, 2),
  blade_rpm INTEGER,
  
  -- MTH
  mth DECIMAL(10, 2),
  
  -- Metadata
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index pro rychlé dotazy
  CONSTRAINT idx_telemetrie_stroj_time UNIQUE (stroj_id, timestamp)
);

CREATE INDEX idx_telemetrie_stroj ON telemetrie_log(stroj_id, timestamp DESC);
CREATE INDEX idx_telemetrie_recent ON telemetrie_log(created_at DESC) WHERE created_at > NOW() - INTERVAL '24 hours';

-- Povolit Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE telemetrie_log;

-- RLS Policies
ALTER TABLE telemetrie_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Všichni mohou číst telemetrii"
  ON telemetrie_log FOR SELECT
  USING (true);

CREATE POLICY "Authenticated může vkládat telemetrii"
  ON telemetrie_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### 2. **Telemetrie Sync Service** (PRIORITA 2)

```typescript
// src/lib/telemetry-sync.ts
import { supabase } from './supabase';

const BARBIERI_API_URL = 'http://192.168.4.1:5000';
const SYNC_INTERVAL_MS = 5000; // 5 sekund

export class TelemetrySync {
  private intervalId: NodeJS.Timeout | null = null;
  private strojId: string;

  constructor(strojId: string) {
    this.strojId = strojId;
  }

  async start() {
    console.log('🔄 Telemetry sync started');
    
    // První sync okamžitě
    await this.syncTelemetry();
    
    // Pak každých 5 sekund
    this.intervalId = setInterval(() => {
      this.syncTelemetry();
    }, SYNC_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🔄 Telemetry sync stopped');
    }
  }

  private async syncTelemetry() {
    try {
      // 1. Fetch z Barbieri API
      const response = await fetch(`${BARBIERI_API_URL}/api/telemetry`);
      if (!response.ok) throw new Error('Barbieri API nedostupné');
      
      const data = await response.json();
      
      // 2. Uložit do Supabase
      const { error } = await supabase
        .from('telemetrie_log')
        .insert([{
          stroj_id: this.strojId,
          gps_lat: data.gps.latitude,
          gps_lng: data.gps.longitude,
          gps_alt: data.gps.altitude,
          rtk_status: data.rtk.status,
          rtk_accuracy_cm: data.rtk.accuracy_cm,
          speed_kmh: data.motion.speed_kmh,
          heading_deg: data.motion.heading_deg,
          battery_voltage: data.power.battery_voltage,
          battery_percentage: data.power.battery_percentage,
          engine_temp_c: data.diagnostics.engine_temp_c,
          oil_pressure_bar: data.diagnostics.oil_pressure_bar,
          blade_rpm: data.diagnostics.blade_rpm,
          mth: data.mth,
          timestamp: data.timestamp
        }]);
      
      if (error) throw error;
      
      // 3. Aktualizovat MTH v tabulce stroje
      await supabase
        .from('stroje')
        .update({ aktualni_mth: Math.floor(data.mth) })
        .eq('id', this.strojId);
      
    } catch (error) {
      console.error('❌ Telemetry sync error:', error);
    }
  }
}
```

### 3. **Servisní intervaly** (PRIORITA 3)

```sql
-- Tabulka pro definici intervalů
CREATE TABLE service_intervals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nazev TEXT NOT NULL,
  interval_mth INTEGER NOT NULL,
  first_service_mth INTEGER, -- Speciální případ (olej po 50 mth)
  kriticky BOOLEAN DEFAULT false,
  popis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO service_intervals (nazev, interval_mth, first_service_mth, kriticky, popis) VALUES
  ('Výměna motorového oleje', 100, 50, true, 'PRVNÍ výměna po 50 mth, další pak každých 100 mth'),
  ('Kontrola a údržba nožů', 50, NULL, true, 'Kontrola opotřebení, ostření nebo výměna'),
  ('Velký servis', 500, NULL, true, 'Kompletní servisní prohlídka'),
  ('Kontrola řemenů', 200, NULL, false, 'Vizuální kontrola a seřízení'),
  ('Kontrola vzduchového filtru', 100, NULL, false, 'Čištění nebo výměna'),
  ('Mazání ložisek', 100, NULL, false, 'Mazání pohyblivých částí');

-- View pro přehled servisů
CREATE OR REPLACE VIEW v_service_status AS
SELECT 
  s.id AS stroj_id,
  s.vyrobni_cislo,
  s.aktualni_mth,
  si.nazev AS service_name,
  si.interval_mth,
  si.first_service_mth,
  si.kriticky,
  
  -- Kolik servisů tohoto typu už bylo
  (SELECT COUNT(*) 
   FROM servisni_zaznamy sz 
   WHERE sz.stroj_id = s.id 
   AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'
  ) AS service_count,
  
  -- Poslední servis tohoto typu
  (SELECT MAX(mth_pri_servisu) 
   FROM servisni_zaznamy sz 
   WHERE sz.stroj_id = s.id 
   AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'
  ) AS last_service_mth,
  
  -- Další servis
  CASE 
    WHEN (SELECT COUNT(*) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%') = 0 
      AND si.first_service_mth IS NOT NULL
    THEN si.first_service_mth
    ELSE COALESCE(
      (SELECT MAX(mth_pri_servisu) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'),
      0
    ) + si.interval_mth
  END AS next_service_mth,
  
  -- Je po termínu?
  s.aktualni_mth >= CASE 
    WHEN (SELECT COUNT(*) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%') = 0 
      AND si.first_service_mth IS NOT NULL
    THEN si.first_service_mth
    ELSE COALESCE(
      (SELECT MAX(mth_pri_servisu) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'),
      0
    ) + si.interval_mth
  END AS is_overdue

FROM stroje s
CROSS JOIN service_intervals si
WHERE si.kriticky = true
ORDER BY s.id, next_service_mth;
```

### 4. **Realtime mapa** (PRIORITA 4)

```typescript
// src/components/RealtimeMap.tsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import { supabase } from '@/lib/supabase';
import 'leaflet/dist/leaflet.css';

interface TelemetryPoint {
  gps_lat: number;
  gps_lng: number;
  rtk_status: 'FIX' | 'FLOAT' | 'NONE';
  speed_kmh: number;
  battery_percentage: number;
  timestamp: string;
}

export function RealtimeMap({ strojId }: { strojId: string }) {
  const [currentPosition, setCurrentPosition] = useState<TelemetryPoint | null>(null);
  const [trail, setTrail] = useState<[number, number][]>([]);

  useEffect(() => {
    // 1. Načti poslední pozici
    loadLatestPosition();

    // 2. Subscribe na realtime updates
    const channel = supabase
      .channel('telemetry-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetrie_log',
          filter: `stroj_id=eq.${strojId}`
        },
        (payload) => {
          const newPoint = payload.new as TelemetryPoint;
          setCurrentPosition(newPoint);
          
          // Přidej do trail (max 100 bodů)
          setTrail(prev => {
            const updated = [...prev, [newPoint.gps_lat, newPoint.gps_lng] as [number, number]];
            return updated.slice(-100);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [strojId]);

  const loadLatestPosition = async () => {
    const { data } = await supabase
      .from('telemetrie_log')
      .select('*')
      .eq('stroj_id', strojId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCurrentPosition(data);
    }
  };

  const getMarkerColor = (rtk: string): string => {
    if (rtk === 'FIX') return '#22c55e'; // zelená
    if (rtk === 'FLOAT') return '#f97316'; // oranžová
    return '#ef4444'; // červená
  };

  if (!currentPosition) {
    return <div>Načítání pozice...</div>;
  }

  return (
    <MapContainer
      center={[currentPosition.gps_lat, currentPosition.gps_lng]}
      zoom={18}
      className="h-[600px] w-full rounded-xl"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />

      {/* Trail - cesta stroje */}
      {trail.length > 1 && (
        <Polyline
          positions={trail}
          pathOptions={{
            color: '#3b82f6',
            weight: 3,
            opacity: 0.6
          }}
        />
      )}

      {/* Aktuální pozice */}
      <CircleMarker
        center={[currentPosition.gps_lat, currentPosition.gps_lng]}
        radius={12}
        pathOptions={{
          color: getMarkerColor(currentPosition.rtk_status),
          fillColor: getMarkerColor(currentPosition.rtk_status),
          fillOpacity: 0.8,
          weight: 3
        }}
      >
        <Popup>
          <div className="space-y-2">
            <p><strong>RTK:</strong> {currentPosition.rtk_status}</p>
            <p><strong>Rychlost:</strong> {currentPosition.speed_kmh.toFixed(1)} km/h</p>
            <p><strong>Baterie:</strong> {currentPosition.battery_percentage}%</p>
            <p className="text-xs text-muted-foreground">
              {new Date(currentPosition.timestamp).toLocaleString('cs')}
            </p>
          </div>
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
```

## 📋 SPRÁVNÝ IMPLEMENTAČNÍ PLÁN

### Fáze 1: Telemetrie Bridge (1-2 dny)
1. ✅ Vytvořit tabulku `telemetrie_log` v Supabase
2. ✅ Implementovat `TelemetrySync` service
3. ✅ Spustit sync při startu aplikace
4. ✅ Testovat ukládání dat

### Fáze 2: Realtime Mapa (1 den)
1. ✅ Vytvořit `RealtimeMap` komponentu
2. ✅ Nastavit Realtime subscription
3. ✅ Implementovat trail (cesta stroje)
4. ✅ Přidat do Dashboard

### Fáze 3: Servisní logika (1 den)
1. ✅ Vytvořit tabulku `service_intervals`
2. ✅ Vytvořit view `v_service_status`
3. ✅ Implementovat `ServiceDueIndicator` komponentu
4. ✅ Přidat notifikace

### Fáze 4: Offline detekce (0.5 dne)
1. ✅ Implementovat watchdog pro detekci offline
2. ✅ Přidat UI indikátor
3. ✅ Testovat

## 🚫 CO NEIMPLEMENTOVAT

1. ❌ **PLC Simulátor** - Barbieri má vlastní PLC
2. ❌ **Vlastní telemetrie tabulka bez bridge** - Data musí přijít z Barbieri API
3. ❌ **Duplikace logiky** - Neukládat MTH na 2 místech

---

**Závěr**: Původní dokument měl dobré nápady, ale **nepochopil skutečnou architekturu** projektu. Tato dokumentace odráží **reálný stav** a poskytuje **správný implementační plán**.
