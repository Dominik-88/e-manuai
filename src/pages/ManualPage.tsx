import React, { useState } from 'react';
import { Search, ChevronRight, BookOpen, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Manual structure based on authentic Barbieri documentation
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

export default function ManualPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['priprava']);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  // Filter sections based on search
  const filteredStructure = manualStructure.map(chapter => ({
    ...chapter,
    sections: chapter.sections.filter(section =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(chapter => 
    chapter.sections.length > 0 ||
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedContent = manualStructure
    .flatMap(ch => ch.sections)
    .find(s => s.id === selectedSection);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Vyhledávání v manuálu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10"
        />
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Table of contents */}
        <div className="w-72 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border p-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-5 w-5" />
              Obsah
            </h2>
          </div>
          <ScrollArea className="h-[calc(100%-3.5rem)]">
            <div className="p-2">
              {filteredStructure.map(chapter => (
                <Collapsible 
                  key={chapter.id}
                  open={expandedChapters.includes(chapter.id)}
                  onOpenChange={() => toggleChapter(chapter.id)}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted">
                    {chapter.title}
                    <ChevronDown className={cn(
                      'h-4 w-4 transition-transform',
                      expandedChapters.includes(chapter.id) && 'rotate-180'
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-2 space-y-1 border-l border-border pl-3">
                      {chapter.sections.map(section => (
                        <button
                          key={section.id}
                          onClick={() => setSelectedSection(section.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                            selectedSection === section.id && 'bg-primary/10 text-primary font-medium'
                          )}
                        >
                          <ChevronRight className="h-3 w-3" />
                          {section.title}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card">
          <ScrollArea className="h-full">
            <div className="p-6">
              {selectedContent ? (
                <>
                  <h1 className="mb-4 text-2xl font-bold">{selectedContent.title}</h1>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">
                      {selectedContent.content}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
                  <h2 className="text-xl font-semibold">Technický manuál</h2>
                  <p className="mt-2 text-muted-foreground">
                    Vyberte kapitolu z obsahu vlevo
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
