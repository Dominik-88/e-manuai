# Technická dokumentace - e-ManuAI

## 🏗️ Architektura

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │ Manual   │  │ Service  │  │ Areas   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   AI     │  │Settings  │  │ Digital  │  │  Auth   │ │
│  │Assistant │  │          │  │  Twin    │  │         │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Supabase Backend Services                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │PostgreSQL│  │   Auth   │  │Real-time │  │  Edge   │ │
│  │ Database │  │          │  │          │  │Functions│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  CZEPOS  │  │ OpenAI   │  │ Leaflet  │              │
│  │   RTK    │  │   API    │  │   Maps   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

## 📊 Databázové schéma

### Hlavní tabulky

#### `stroje` (Stroje)
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

#### `servisni_zaznamy` (Servisní záznamy)
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

#### `arealy` (Areály)
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

#### `sekaci_session` (Sekací session - Digital Twin)
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

### Row Level Security (RLS)

Všechny tabulky mají aktivní RLS policies:

```sql
-- Příklad: Servisní záznamy
ALTER TABLE servisni_zaznamy ENABLE ROW LEVEL SECURITY;

-- Čtení: Všichni autentizovaní uživatelé
CREATE POLICY "Authenticated users can read service records"
  ON servisni_zaznamy FOR SELECT
  TO authenticated
  USING (is_deleted = FALSE);

-- Zápis: Pouze admin a technik
CREATE POLICY "Admin and technik can insert service records"
  ON servisni_zaznamy FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'technik')
    )
  );
```

## 🔐 Autentizace a Autorizace

### Role systému

1. **Admin** - Plný přístup
   - Správa uživatelů
   - Mazání záznamů
   - Změna nastavení systému

2. **Technik** - Technické operace
   - Vytváření/editace servisních záznamů
   - Mazání vlastních záznamů
   - Správa areálů

3. **Operátor** - Základní operace
   - Čtení všech dat
   - Vytváření sekacích session
   - Používání AI asistenta

### Auth Flow

```typescript
// 1. Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// 2. Get session
const { data: { session } } = await supabase.auth.getSession();

// 3. Check role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

// 4. Protected action
if (profile.role === 'admin' || profile.role === 'technik') {
  // Allow action
}
```

## 🤖 AI Asistent

### Edge Function Architecture

```typescript
// supabase/functions/ai-assistant/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { messages, machineContext } = await req.json();
  
  // 1. Validate auth
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  // 2. Build context
  const systemPrompt = buildSystemPrompt(machineContext);
  
  // 3. Call OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true
    })
  });
  
  // 4. Stream response
  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
});
```

### Context Building

```typescript
function buildSystemPrompt(machineContext: MachineContext): string {
  return `
Jsi AI asistent pro robotickou sekačku Barbieri XRot 95 EVO.

AKTUÁLNÍ STAV STROJE:
- Model: ${machineContext.model}
- Výrobní číslo: ${machineContext.vyrobni_cislo}
- Aktuální MTH: ${machineContext.aktualni_mth}
- Stav: ${machineContext.stav}

TVOJE ZNALOSTI:
- Technické specifikace stroje
- Servisní intervaly a postupy
- RTK navigace a kalibrace
- Řešení běžných problémů
- Bezpečnostní protokoly

ODPOVÍDEJ:
- Stručně a konkrétně
- S technickými detaily
- S odkazy na manuál
- Bezpečnostně orientovaně
`;
}
```

## 🗺️ Mapování a RTK

### Leaflet Integration

```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom marker icon
const createCustomIcon = (type: string, color: string) => {
  return L.divIcon({
    className: 'custom-area-marker',
    html: `
      <div style="background: ${color}22; border: 2px solid ${color}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 20px;">${getTypeEmoji(type)}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Map component
<MapContainer
  center={[50.0755, 14.4378]} // Praha
  zoom={13}
  className="h-[400px] rounded-xl"
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />
  {areas.map(area => (
    <Marker
      key={area.id}
      position={[area.gps_latitude, area.gps_longitude]}
      icon={createCustomIcon(area.typ, getTypeColor(area.typ))}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold">{area.nazev}</h3>
          <p className="text-sm">{area.plocha_m2} m²</p>
        </div>
      </Popup>
    </Marker>
  ))}
</MapContainer>
```

### RTK Status Monitoring

```typescript
// Real-time RTK status from telemetry
const { telemetry } = useBarbieriiClient();

const getRtkStatus = (telemetry: Telemetry) => {
  if (!telemetry.rtk_connected) {
    return { status: 'NONE', color: 'destructive', accuracy: 'Bez korekce' };
  }
  
  if (telemetry.rtk_fix_type === 'FIX') {
    return { status: 'FIX', color: 'success', accuracy: '1-3 cm' };
  }
  
  if (telemetry.rtk_fix_type === 'FLOAT') {
    return { status: 'FLOAT', color: 'warning', accuracy: '~1 m' };
  }
  
  return { status: 'NONE', color: 'destructive', accuracy: 'Bez korekce' };
};
```

## 📊 Real-time Telemetrie

### WebSocket Connection

```typescript
// Supabase Realtime subscription
const subscription = supabase
  .channel('telemetry')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'telemetry_data',
      filter: `machine_id=eq.${machineId}`
    },
    (payload) => {
      setTelemetry(payload.new);
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

### Telemetry Data Structure

```typescript
interface Telemetry {
  machine_id: string;
  timestamp: string;
  mth: number;
  battery_voltage: number;
  battery_percentage: number;
  rtk_connected: boolean;
  rtk_fix_type: 'NONE' | 'FLOAT' | 'FIX';
  gps_latitude: number;
  gps_longitude: number;
  gps_altitude: number;
  speed_kmh: number;
  heading_degrees: number;
  blade_rpm: number;
  engine_temp_celsius: number;
  fuel_level_percentage: number;
}
```

## 🎨 Design Tokens

### CSS Variables

```css
:root {
  /* Colors */
  --background: 240 10% 6%;
  --foreground: 210 40% 98%;
  --primary: 220 60% 50%;
  --success: 145 70% 50%;
  --warning: 32 95% 55%;
  --destructive: 0 75% 65%;
  --info: 200 80% 55%;
  
  /* Spacing */
  --radius: 0.5rem;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Roboto Mono', monospace;
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        success: 'hsl(var(--success))',
        // ...
      },
      fontSize: {
        'field-sm': ['0.9375rem', { lineHeight: '1.4' }],
        'field-base': ['1rem', { lineHeight: '1.5' }],
        'mth': ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }],
      },
      spacing: {
        'touch': '3.5rem', // 56px
        'touch-sm': '3rem', // 48px
      },
    },
  },
};
```

## 🚀 Performance Optimizations

### Code Splitting

```typescript
// Lazy load routes
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ManualPage = lazy(() => import('@/pages/ManualPage'));
const ServicePage = lazy(() => import('@/pages/ServicePage'));

// Suspense wrapper
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/manual" element={<ManualPage />} />
    <Route path="/servis" element={<ServicePage />} />
  </Routes>
</Suspense>
```

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Memoization

```typescript
// Expensive computations
const filteredServices = useMemo(() => {
  if (!services) return [];
  return services.filter(s => {
    const matchesSearch = !searchQuery || 
      s.popis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTyp = filterTyp === 'all' || s.typ_zasahu === filterTyp;
    return matchesSearch && matchesTyp;
  });
}, [services, searchQuery, filterTyp]);
```

## 📱 PWA Configuration

### Service Worker

```javascript
// public/sw.js
const CACHE_NAME = 'e-manuai-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### Manifest

```json
{
  "name": "e-ManuAI",
  "short_name": "e-ManuAI",
  "description": "Inteligentní systém pro správu robotických sekaček",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f17",
  "theme_color": "#3d7acc",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🔍 Monitoring & Analytics

### Error Tracking

```typescript
// Error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('Error caught:', error, errorInfo);
    
    // Send to Sentry/LogRocket/etc.
    // trackError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Performance Monitoring

```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## 📚 Další zdroje

- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Leaflet Docs](https://leafletjs.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

**Poslední aktualizace**: 7. února 2026
