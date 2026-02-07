import React, { useState, useMemo } from 'react';
import {
  Search, ChevronRight, BookOpen, ChevronDown, ArrowLeft,
  Fuel, Satellite, Shield, Gamepad2, Cpu, Wrench, Navigation, Lock, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const chapterIcons: Record<string, React.ReactNode> = {
  priprava: <Fuel className="h-4 w-4" />,
  ovladani: <Gamepad2 className="h-4 w-4" />,
  specifikace: <Cpu className="h-4 w-4" />,
  udrzba: <Wrench className="h-4 w-4" />,
  rtk: <Navigation className="h-4 w-4" />,
  bezpecnost: <Lock className="h-4 w-4" />,
};

const chapterColors: Record<string, string> = {
  priprava: 'text-warning',
  ovladani: 'text-primary',
  specifikace: 'text-info',
  udrzba: 'text-destructive',
  rtk: 'text-success',
  bezpecnost: 'text-warning',
};

interface Section {
  id: string;
  title: string;
  content: string;
}

const manualStructure = [
  {
    id: 'priprava',
    title: '1. Příprava stroje',
    sections: [
      { id: 'palivo', title: '1.1 Kontrola paliva', content: 'Používejte bezolovnatý benzín 95 oktanů (max E10). Nikdy nepoužívejte naftu nebo směsové palivo.' },
      { id: 'rtk-pripojeni', title: '1.2 RTK připojení', content: 'Dashboard stroje: http://192.168.4.1:5000\n\nNTRIP Server: rtk.cuzk.cz\nPort: 2101\nMountpoint: MAX3\n\nPřihlášení: Použijte své CZEPOS přihlašovací údaje (nikoliv BankID!)' },
      { id: 'bezpecnost', title: '1.3 Bezpečnostní systémy', content: 'Před spuštěním zkontrolujte:\n- Nouzové stop tlačítko\n- Detekci překážek\n- Geofencing hranice\n- IP67 těsnění komponent' },
    ],
  },
  {
    id: 'ovladani',
    title: '2. Ovládání stroje',
    sections: [
      { id: 'manualni', title: '2.1 Manuální režim', content: 'Plná kontrola operátorem pomocí joysticku nebo ovladače. Použití: přesun, obtížný terén. RTK může být i FLOAT/NONE.' },
      { id: 'poloautonomni', title: '2.2 Poloautonomní režim', content: 'Robot jede po předem zadané trase. Operátor musí dohlížet a může zasáhnout. Bezpečnostní systémy aktivní. RTK doporučeno FIX.' },
      { id: 'autonomni', title: '2.3 Autonomní režim', content: 'Robot seká samostatně podle nastaveného plánu.\n\nS-Mode varianty:\n• S-Mode 1: Bod-do-bodu\n• S-Mode 2: Spirála\n• S-Mode 3: Obdélník\n• S-Mode 4: Automatické pruhy (95 cm)\n\nNastavení: SHIFT + A (start), SHIFT + B (konec)\n\nPOZOR: Vyžaduje RTK FIX (1-3 cm přesnost)!' },
    ],
  },
  {
    id: 'specifikace',
    title: '3. Technické specifikace',
    sections: [
      { id: 'hardware', title: '3.1 Hardware', content: 'Compass Servo Drive 2.0 (R54)\nProcesor: Broadcom BCM2837 (ARM Cortex-A53, 1.4 GHz)\nRAM: 1 GB\nGNSS: u-blox ZED-F9P\nSignály: GPS, GLONASS, BEIDOU, Galileo' },
      { id: 'komunikace', title: '3.2 Komunikace', content: 'LTE modem s MIMO\nWi-Fi\nBluetooth\n3x CAN-BUS sběrnice\nSériové rozhraní pro GNSS\nIP67 ochrana' },
    ],
  },
  {
    id: 'udrzba',
    title: '4. Údržba a servis',
    sections: [
      { id: 'intervaly', title: '4.1 Servisní intervaly', content: 'VÝMĚNA OLEJE:\n• První servis: 50 mth ⚠️\n• Další servisy: každých 100 mth\n• Kritičnost: KRITICKÁ\n\nKONTROLA NOŽŮ:\n• Interval: 50 mth\n• Kritičnost: DŮLEŽITÁ\n\nVELKÝ SERVIS:\n• Interval: 500 mth\n• Kritičnost: KRITICKÁ' },
      { id: 'bezna-udrzba', title: '4.2 Běžná údržba', content: 'Po každém použití:\n- Očistěte sekací jednotku\n- Zkontrolujte stav nožů\n- Kontrola pneumatik' },
      { id: 'reseni-problemu', title: '4.3 Řešení problémů', content: 'Robot nejede rovně:\n1. Zkontrolujte RTK status\n2. Ověřte kalibraci\n3. Kontrola mechaniky nožů' },
    ],
  },
  {
    id: 'rtk',
    title: '5. Autonomní navigace (RTK)',
    sections: [
      { id: 'co-je-rtk', title: '5.1 Co je RTK', content: 'RTK = Real-Time Kinematic\nSystém GPS s centimetrovou přesností.\n\nBěžná GPS: 3-5 m přesnost\nRTK: 1-3 cm přesnost\n\nVyužívá korekční data z base station.' },
      { id: 'czepos', title: '5.2 Připojení k CZEPOS', content: 'URL: https://czepos.cuzk.cz\nRegistrace: přes BankID\n\nNTRIP nastavení:\nServer: rtk.cuzk.cz\nPort: 2101\nMountpoint: MAX3\nLogin: Vaše CZEPOS údaje' },
      { id: 'kalibrace', title: '5.3 Kalibrace a nastavení', content: 'Dashboard: http://192.168.4.1:5000\nSekce: NTRIP Settings' },
      { id: 'rtk-problemy', title: '5.4 Řešení problémů RTK', content: 'RTK stavy:\n🟢 FIX: 1-3 cm přesnost ✓ PRO AUTONOMII\n🟠 FLOAT: ~1 m přesnost – POUZE MANUÁL\n🔴 NONE: Bez korekce – NOUZOVÝ REŽIM\n\nTypické problémy:\n- Překážky (budovy, stromy)\n- Špatné umístění antény\n- Vzdálenost base ↔ rover' },
    ],
  },
  {
    id: 'bezpecnost',
    title: '6. Bezpečnost',
    sections: [
      { id: 'bezp-systemy', title: '6.1 Bezpečnostní systémy', content: '✓ Detekce překážek (ultrazvuk/lidar/kamery)\n✓ Nouzové stop (fyzické + dálkové)\n✓ Automatické zastavení při ztrátě RTK\n✓ Geofencing\n✓ Detekce naklopení\n✓ IP67 ochrana' },
      { id: 'provozni-bezpecnost', title: '6.2 Provozní bezpečnost', content: 'Vždy zajistěte:\n- Oplocený areál\n- Žádné osoby v zóně\n- Funkční nouzové stop\n- Stabilní RTK FIX' },
    ],
  },
];

function highlightText(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="rounded bg-primary/30 px-0.5 text-foreground">{part}</mark> : part
  );
}

function renderContent(content: string, query: string) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Bullet/list items
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('✓')) {
          const bullet = trimmed[0];
          const text = trimmed.slice(1).trim();
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className={cn('mt-0.5 shrink-0 text-sm', bullet === '✓' ? 'text-success' : 'text-muted-foreground')}>{bullet}</span>
              <span className="text-sm leading-relaxed">{highlightText(text, query)}</span>
            </div>
          );
        }

        // Numbered items
        if (/^\d+\./.test(trimmed)) {
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-primary">{trimmed.match(/^\d+\./)?.[0]}</span>
              <span className="text-sm leading-relaxed">{highlightText(trimmed.replace(/^\d+\.\s*/, ''), query)}</span>
            </div>
          );
        }

        // Key-value
        if (trimmed.includes(':') && trimmed.indexOf(':') < 30) {
          const [key, ...rest] = trimmed.split(':');
          const value = rest.join(':').trim();
          if (value) {
            return (
              <div key={i} className="flex flex-wrap gap-1 pl-2 text-sm">
                <span className="font-medium text-muted-foreground">{highlightText(key, query)}:</span>
                <span className="font-mono text-foreground">{highlightText(value, query)}</span>
              </div>
            );
          }
        }

        // Warning
        if (trimmed.startsWith('POZOR') || trimmed.includes('⚠️')) {
          return (
            <div key={i} className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
              {highlightText(trimmed, query)}
            </div>
          );
        }

        // Header-like
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes(':')) {
          return (
            <h3 key={i} className="pt-2 text-sm font-bold uppercase tracking-wider text-primary">
              {highlightText(trimmed, query)}
            </h3>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed">
            {highlightText(trimmed, query)}
          </p>
        );
      })}
    </div>
  );
}

export default function ManualPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['priprava']);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev =>
      prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
    );
  };

  const filteredStructure = useMemo(() =>
    manualStructure.map(chapter => ({
      ...chapter,
      sections: chapter.sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(chapter =>
      chapter.sections.length > 0 ||
      chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const selectedContent = manualStructure
    .flatMap(ch => ch.sections)
    .find(s => s.id === selectedSection);

  const selectedChapter = manualStructure.find(ch =>
    ch.sections.some(s => s.id === selectedSection)
  );

  const showContent = selectedSection && selectedContent;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Technický manuál</h1>
          <p className="text-xs text-muted-foreground">Barbieri XRot 95 EVO — provozní dokumentace</p>
        </div>
      </div>

      {/* Breadcrumb */}
      {showContent && selectedChapter && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button onClick={() => setSelectedSection(null)} className="hover:text-foreground transition-colors">Obsah</button>
          <ChevronRight className="h-3 w-3" />
          <button onClick={() => setSelectedSection(null)} className="hover:text-foreground transition-colors">{selectedChapter.title}</button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{selectedContent.title}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Vyhledávání v manuálu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10 text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Mobile: Back button */}
      {showContent && (
        <div className="md:hidden">
          <Button variant="ghost" onClick={() => setSelectedSection(null)} className="h-11 gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Zpět na obsah
          </Button>
        </div>
      )}

      <div className="flex gap-4">
        {/* TOC */}
        <div className={cn(
          'w-full shrink-0 overflow-hidden rounded-xl border border-border bg-card md:w-72',
          showContent && 'hidden md:block'
        )}>
          <div className="border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Obsah
            </h2>
          </div>
          <ScrollArea className="max-h-[calc(100dvh-18rem)]">
            <div className="p-2">
              {filteredStructure.map(chapter => (
                <Collapsible
                  key={chapter.id}
                  open={expandedChapters.includes(chapter.id)}
                  onOpenChange={() => toggleChapter(chapter.id)}
                >
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted min-h-[44px]">
                    <span className={cn('shrink-0', chapterColors[chapter.id])}>
                      {chapterIcons[chapter.id]}
                    </span>
                    <span className="flex-1">{chapter.title}</span>
                    <ChevronDown className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      expandedChapters.includes(chapter.id) && 'rotate-180'
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 space-y-0.5 border-l-2 border-border pl-3">
                      {chapter.sections.map(section => (
                        <button
                          key={section.id}
                          onClick={() => {
                            setSelectedSection(section.id);
                            window.scrollTo(0, 0);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted min-h-[40px]',
                            selectedSection === section.id && 'bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[3px] pl-[11px]'
                          )}
                        >
                          <ChevronRight className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{section.title}</span>
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Content */}
        <div className={cn(
          'flex-1 overflow-hidden rounded-xl border border-border bg-card',
          !showContent && 'hidden md:block'
        )}>
          <ScrollArea className="max-h-[calc(100dvh-18rem)]">
            <div className="p-4 md:p-6">
              {selectedContent ? (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    {selectedChapter && (
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-muted', chapterColors[selectedChapter.id])}>
                        {chapterIcons[selectedChapter.id]}
                      </div>
                    )}
                    <h1 className="text-lg font-bold md:text-xl">{selectedContent.title}</h1>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    {renderContent(selectedContent.content, searchQuery)}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/20" />
                  <h2 className="text-lg font-semibold">Technický manuál</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Vyberte kapitolu z obsahu vlevo</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
