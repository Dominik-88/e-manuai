# e-ManuAI v2.0

> **Inteligentní systém pro správu a údržbu robotických sekaček Barbieri XRot 95 EVO**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://e-manuai.lovable.app/)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/Dominik-88/e-manuai/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)

## 🎯 O projektu

**e-ManuAI** je komplexní webová aplikace pro správu, monitoring a údržbu autonomních robotických sekaček Barbieri XRot 95 EVO. Aplikace kombinuje moderní technologie s průmyslovým designem pro optimální uživatelský zážitek v terénu.

## ✨ Klíčové funkce

### 🆕 **Nové ve v2.0**

#### 🗺️ **Realtime Live Tracking**
- Live pozice stroje na interaktivní mapě
- Trail (cesta stroje) za poslední hodinu
- Barevné indikátory RTK statusu (FIX/FLOAT/NONE)
- Realtime updates každých 5 sekund
- Detailní telemetrie v popup (rychlost, baterie, teplota)

#### 🔧 **Inteligentní servisní systém**
- Automatické sledování 8 servisních intervalů
- Vizuální upozornění na blížící se servisy
- Detekce servisů po termínu
- Progress bar s přesným zbytkem MTH
- Historie všech servisů

#### 📡 **Telemetrie Bridge**
- Automatické ukládání telemetrie z Barbieri API
- Historie GPS pozic za 30 dní
- Realtime synchronizace
- Analytics a reporting

### 📊 **Základní funkce**

- **Dashboard** - Real-time monitoring MTH, stavu stroje a telemetrie
- **Technický manuál** - Interaktivní dokumentace s vyhledáváním
- **Servisní knížka** - Evidence servisních zásahů s exportem do PDF/Excel
- **Správa areálů** - Mapování a plánování tras s RTK navigací
- **AI Asistent** - Inteligentní pomocník pro technické dotazy
- **Digital Twin** - Záznam a analýza sekacích session
- **PWA** - Plně funkční offline režim

## 🚀 Technologie

### Frontend
- **React 18.3** - Moderní UI framework
- **TypeScript 5.8** - Type-safe development
- **Vite** - Rychlý build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Komponenty s Radix UI
- **React Query** - Data fetching & caching
- **React Router** - Client-side routing
- **Leaflet** - Interaktivní mapy

### Backend & Services
- **Supabase** - PostgreSQL databáze, Auth, Real-time
- **Edge Functions** - Serverless AI asistent
- **Row Level Security** - Bezpečnost na úrovni řádků
- **Realtime Subscriptions** - Live updates

### Design System
- **Industrial Dark Theme** - Optimalizováno pro venkovní použití
- **Touch-optimized** - Minimálně 44px touch targets (iOS guidelines)
- **Accessibility** - WCAG AA compliant, ARIA labels
- **Responsive** - Mobile-first přístup

## 📦 Instalace a spuštění

### Předpoklady
- Node.js 18+ a npm
- Git
- Supabase účet

### Lokální vývoj

```bash
# 1. Klonování repozitáře
git clone https://github.com/Dominik-88/e-manuai.git
cd e-manuai

# 2. Instalace závislostí
npm install

# 3. Konfigurace prostředí
# Vytvořte .env soubor s následujícími proměnnými:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. Spuštění databázových migrací
# Otevřete Supabase Dashboard > SQL Editor
# Spusťte migrace v pořadí:
# - supabase/migrations/20260207_telemetry_system.sql
# - supabase/migrations/20260207_service_intervals.sql

# 5. Spuštění dev serveru
npm run dev

# Aplikace běží na http://localhost:5173
```

### Build pro produkci

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## 🏗️ Struktura projektu

```
e-manuai/
├── src/
│   ├── components/       # React komponenty
│   │   ├── auth/        # Autentizace
│   │   ├── dashboard/   # Dashboard widgety
│   │   ├── digital-twin/# Digital Twin komponenty
│   │   ├── diagnostics/ # AI diagnostika
│   │   ├── layout/      # Layout komponenty
│   │   ├── map/         # 🆕 Mapové komponenty (Realtime)
│   │   ├── route/       # Plánování tras
│   │   ├── service/     # 🆕 Servisní komponenty
│   │   ├── settings/    # Nastavení
│   │   └── ui/          # shadcn/ui komponenty
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── integrations/    # Supabase integrace
│   ├── lib/             # 🆕 Utility funkce (telemetry-sync)
│   ├── pages/           # Stránky aplikace
│   ├── styles/          # CSS styly
│   ├── types/           # TypeScript typy
│   └── App.tsx          # Hlavní komponenta
├── supabase/            # Supabase konfigurace
│   ├── functions/       # Edge Functions
│   └── migrations/      # 🆕 Databázové migrace (v2.0)
└── public/              # Statické soubory
```

## 🗄️ Databázové schéma

### Hlavní tabulky

- **stroje** - Základní informace o strojích
- **servisni_zaznamy** - Historie servisních zásahů
- **arealy** - GPS souřadnice areálů
- **sekaci_session** - Digital Twin záznamy
- **🆕 telemetrie_log** - Historie telemetrie (GPS, RTK, diagnostika)
- **🆕 service_intervals** - Definice servisních intervalů

### Views

- **🆕 v_service_status** - Kompletní přehled servisního stavu
- **🆕 v_stroje_live_status** - Live status všech strojů

### Funkce

- **🆕 get_latest_telemetry()** - Poslední telemetrie
- **🆕 get_telemetry_trail()** - Historie pozic pro trail
- **🆕 get_next_service()** - Nejbližší servis
- **🆕 count_overdue_services()** - Počet servisů po termínu

## 🎨 Design System

### Barvy
- **Primary**: Steel Blue (#3d7acc) - Hlavní akční prvky
- **Success**: Signal Green (#00e676) - Úspěšné stavy, RTK FIX
- **Warning**: Orange (#ff9500) - Varování, RTK FLOAT
- **Destructive**: Red (#ff5252) - Kritické stavy, RTK NONE
- **Info**: RTK Blue - Informační prvky

### Typografie
- **Sans**: Inter - Hlavní text
- **Mono**: Roboto Mono - Technická data (MTH, GPS souřadnice)

### Touch Targets
- Minimální velikost: **44x44px** (iOS Human Interface Guidelines)
- Optimalizováno pro použití v rukavicích

## 🔐 Bezpečnost

- **Row Level Security (RLS)** - Všechny tabulky chráněny RLS policies
- **JWT Authentication** - Supabase Auth
- **Role-based Access** - Admin, Technik, Operátor
- **Audit Log** - Kompletní historie změn
- **Immutable Telemetry** - Telemetrie nelze měnit/mazat

## 📱 PWA Features

- ✅ Offline režim
- ✅ Instalovatelná aplikace
- ✅ Push notifikace (připraveno)
- ✅ Background sync (připraveno)
- ✅ Realtime updates

## 🌐 Deployment

Aplikace je nasazena na **Lovable.dev** s automatickým CI/CD:

- **Production**: https://e-manuai.lovable.app/
- **Auto-deploy**: Push do `main` větve

### Nasazení v2.0

Viz **DEPLOYMENT.md** pro detailní návod na nasazení nových funkcí.

## 📚 Dokumentace

- **README.md** - Tento soubor
- **ARCHITECTURE.md** - Technická architektura projektu
- **DEPLOYMENT.md** - Návod na nasazení
- **CHANGELOG.md** - Historie změn
- **CONTRIBUTING.md** - Guidelines pro vývoj
- **TECHNICAL.md** - Detailní technická dokumentace
- **RELEASE_NOTES_v2.0.md** - Release notes pro v2.0

## 🤝 Přispívání

Projekt je v aktivním vývoji. Pro návrhy a bug reporty použijte GitHub Issues.

Před přispěním si přečtěte **CONTRIBUTING.md**.

## 📊 Statistiky v2.0

- **7 nových souborů**
- **~2000 řádků nového kódu**
- **3 databázové migrace**
- **8 nových komponent/funkcí**
- **2 nové tabulky**
- **2 nové views**
- **6 nových SQL funkcí**

## 🎯 Roadmap

### v2.1 (Plánováno)
- [ ] Push notifikace pro servisy
- [ ] Export telemetrie do CSV/Excel
- [ ] Heatmapa pokrytí areálu
- [ ] Prediktivní údržba s AI
- [ ] Multi-stroj dashboard

### v2.2 (Budoucnost)
- [ ] Offline mapa s cache
- [ ] Custom service intervals
- [ ] Service reminders via email
- [ ] Mobile app (React Native)

## 📄 Licence

© 2026 Dominik Schmied. Všechna práva vyhrazena.

## 🔗 Odkazy

- **Live Demo**: https://e-manuai.lovable.app/
- **GitHub**: https://github.com/Dominik-88/e-manuai
- **Dokumentace**: [Wiki](https://github.com/Dominik-88/e-manuai/wiki)
- **Issues**: [GitHub Issues](https://github.com/Dominik-88/e-manuai/issues)

## 🙏 Poděkování

- **Barbieri** - Za skvělé API a dokumentaci
- **Supabase** - Za realtime infrastrukturu
- **Leaflet** - Za mapovou knihovnu
- **shadcn/ui** - Za krásné komponenty

---

**Vytvořeno s ❤️ pro Barbieri XRot 95 EVO**

**Verze**: 2.0.0  
**Datum**: 7. února 2026  
**Autor**: Dominik Schmied  
**AI Asistent**: Bhindi
