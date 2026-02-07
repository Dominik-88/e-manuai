# e-ManuAI

> **Inteligentní systém pro správu a údržbu robotických sekaček Barbieri XRot 95 EVO**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://e-manuai.lovable.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)

## 🎯 O projektu

**e-ManuAI** je komplexní webová aplikace pro správu, monitoring a údržbu autonomních robotických sekaček Barbieri XRot 95 EVO. Aplikace kombinuje moderní technologie s průmyslovým designem pro optimální uživatelský zážitek v terénu.

### ✨ Klíčové funkce

- 📊 **Dashboard** - Real-time monitoring MTH (motohodin), stavu stroje a telemetrie
- 📖 **Technický manuál** - Interaktivní dokumentace s vyhledáváním
- 🔧 **Servisní knížka** - Evidence servisních zásahů s exportem do PDF/Excel
- 📍 **Správa areálů** - Mapování a plánování tras s RTK navigací
- 🤖 **AI Asistent** - Inteligentní pomocník pro technické dotazy
- 🛰️ **Digital Twin** - Záznam a analýza sekacích session
- 📱 **PWA** - Plně funkční offline režim

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

### Design System
- **Industrial Dark Theme** - Optimalizováno pro venkovní použití
- **Touch-optimized** - Minimálně 44px touch targets (iOS guidelines)
- **Accessibility** - WCAG AA compliant, ARIA labels
- **Responsive** - Mobile-first přístup

## 📦 Instalace a spuštění

### Předpoklady
- Node.js 18+ a npm
- Git

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

# 4. Spuštění dev serveru
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

### Testování

```bash
# Spuštění testů
npm test

# Watch mode
npm run test:watch
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
│   │   ├── map/         # Mapové komponenty
│   │   ├── route/       # Plánování tras
│   │   ├── settings/    # Nastavení
│   │   └── ui/          # shadcn/ui komponenty
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── integrations/    # Supabase integrace
│   ├── lib/             # Utility funkce
│   ├── pages/           # Stránky aplikace
│   ├── styles/          # CSS styly
│   ├── types/           # TypeScript typy
│   └── App.tsx          # Hlavní komponenta
├── supabase/            # Supabase konfigurace
│   ├── functions/       # Edge Functions
│   └── migrations/      # Databázové migrace
└── public/              # Statické soubory
```

## 🎨 Design System

### Barvy
- **Primary**: Steel Blue (#3d7acc) - Hlavní akční prvky
- **Success**: Signal Green (#00e676) - Úspěšné stavy
- **Warning**: Orange (#ff9500) - Varování
- **Destructive**: Red (#ff5252) - Kritické stavy
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

## 📱 PWA Features

- ✅ Offline režim
- ✅ Instalovatelná aplikace
- ✅ Push notifikace (připraveno)
- ✅ Background sync (připraveno)

## 🌐 Deployment

Aplikace je nasazena na **Lovable.dev** s automatickým CI/CD:

- **Production**: https://e-manuai.lovable.app/
- **Auto-deploy**: Push do `main` větve

### Vlastní doména
Pro připojení vlastní domény:
1. Otevřete [Lovable Project Settings](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
2. Přejděte na Settings > Domains
3. Klikněte na "Connect Domain"

## 🤝 Přispívání

Projekt je v aktivním vývoji. Pro návrhy a bug reporty použijte GitHub Issues.

## 📄 Licence

© 2026 Dominik Schmied. Všechna práva vyhrazena.

## 🔗 Odkazy

- **Live Demo**: https://e-manuai.lovable.app/
- **GitHub**: https://github.com/Dominik-88/e-manuai
- **Dokumentace**: [Wiki](https://github.com/Dominik-88/e-manuai/wiki)

---

**Vytvořeno s ❤️ pro Barbieri XRot 95 EVO**
