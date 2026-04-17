import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMachine } from '@/hooks/useMachine';
import { useBarbieriiClient } from '@/hooks/useBarbieriiClient';
import { MthDisplay } from '@/components/dashboard/MthDisplay';
import { AreaStats } from '@/components/dashboard/AreaStats';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { TelemetryLive } from '@/components/dashboard/TelemetryLive';
import { MowingSessionRecorder } from '@/components/digital-twin/MowingSessionRecorder';
import { SessionHistory } from '@/components/digital-twin/SessionHistory';
import { AIDiagnostics } from '@/components/diagnostics/AIDiagnostics';
import { OfflineBanner } from '@/components/layout/OfflineIndicator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Cpu, Clock, Wrench } from 'lucide-react';

export default function DashboardPage() {
  const { machine, loading: machineLoading, updateMth } = useMachine();
  const { telemetry } = useBarbieriiClient();
  const lastMthSyncRef = useRef<number>(0);

  // Auto-sync MTH from telemetry to stroje table (debounced 30s)
  useEffect(() => {
    if (!machine || !telemetry || telemetry.mth <= 0) return;
    if (telemetry.mth <= machine.aktualni_mth) return;

    const now = Date.now();
    if (now - lastMthSyncRef.current < 30_000) return; // 30s debounce

    lastMthSyncRef.current = now;
    updateMth(telemetry.mth).catch(err => {
      console.error('[Dashboard] MTH sync error:', err);
    });
  }, [telemetry?.mth, machine?.aktualni_mth, updateMth, machine]);

  if (machineLoading) {
    return (
      <div className="space-y-4 animate-fade-in" role="status" aria-label="Načítání dashboardu">
        <div className="shimmer h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="shimmer h-48" />
          <div className="shimmer h-48" />
        </div>
        <div className="shimmer h-64" />
        <span className="sr-only">Načítání...</span>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
          <span className="text-4xl" role="img" aria-label="Stroj">🚜</span>
        </div>
        <h2 className="text-xl font-semibold">Žádný stroj není k dispozici</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Kontaktujte administrátora pro přidání stroje.
        </p>
      </div>
    );
  }

  return (
    <>
      <OfflineBanner />
      <div className="space-y-5 animate-fade-in">
        {/* Single semantic H1 for assistive tech */}
        <h1 className="sr-only">e-ManuAI – Barbieri XRot 95 EVO</h1>

        {/* MTH Display - Hero section */}
        <section aria-label="Aktuální stav motoru">
          <MthDisplay machine={machine} />
        </section>

        {/* Primary CTAs - large, gloved-hand sized */}
        <section aria-label="Hlavní akce" className="grid grid-cols-2 gap-3">
          <Link
            to="/provoz/novy"
            className="flex h-16 items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold uppercase text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <Clock className="h-5 w-5" aria-hidden="true" />
            Zahájit provoz
          </Link>
          <Link
            to="/servis/novy"
            className="flex h-16 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-card text-base font-bold uppercase text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
          >
            <Wrench className="h-5 w-5" aria-hidden="true" />
            Zadat servis
          </Link>
        </section>

        {/* Area stats */}
        <section aria-label="Statistiky areálů">
          <AreaStats machineId={machine.id} />
        </section>

        {/* Recent activity */}
        <section aria-label="Nedávná aktivita">
          <RecentActivityCard machineId={machine.id} />
        </section>

        {/* Collapsible: Digital Twin */}
        <section aria-labelledby="digital-twin-heading">
          <Collapsible>
            <CollapsibleTrigger 
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50 min-h-[56px]"
              aria-label="Rozbalit Digital Twin a Telemetrii"
            >
              <span id="digital-twin-heading" className="section-heading">
                <Cpu className="h-4 w-4" aria-hidden="true" />
                Digital Twin & Telemetrie
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-4">
              <MowingSessionRecorder machineId={machine.id} currentMth={machine.aktualni_mth} />
              <SessionHistory machineId={machine.id} />
              <TelemetryLive />
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* AI Diagnostics */}
        <section aria-label="AI Diagnostika">
          <AIDiagnostics />
        </section>
      </div>
    </>
  );
}
