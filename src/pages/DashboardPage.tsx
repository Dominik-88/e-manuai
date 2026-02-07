import React, { useEffect, useRef } from 'react';
import { useMachine } from '@/hooks/useMachine';
import { useBarbieriiClient } from '@/hooks/useBarbieriiClient';
import { startGlobalTelemetrySync, stopGlobalTelemetrySync } from '@/lib/telemetry-sync';
import { MthDisplay } from '@/components/dashboard/MthDisplay';
import { MachineStatusCard } from '@/components/dashboard/MachineStatusCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { AreaStats } from '@/components/dashboard/AreaStats';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { TelemetryLive } from '@/components/dashboard/TelemetryLive';
import { MowingSessionRecorder } from '@/components/digital-twin/MowingSessionRecorder';
import { SessionHistory } from '@/components/digital-twin/SessionHistory';
import { AIDiagnostics } from '@/components/diagnostics/AIDiagnostics';
import { OfflineBanner } from '@/components/layout/OfflineIndicator';
import { RealtimeMap } from '@/components/map/RealtimeMap';
import { ServiceStatusCard } from '@/components/service/ServiceStatusCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Activity, Cpu, MapPin } from 'lucide-react';

export default function DashboardPage() {
  const { machine, loading: machineLoading, updateMth } = useMachine();
  const { telemetry } = useBarbieriiClient();
  const lastMthSyncRef = useRef<number>(0);
  const telemetrySyncStarted = useRef<boolean>(false);

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

  // Start telemetry sync service
  useEffect(() => {
    if (!machine || telemetrySyncStarted.current) return;

    console.log('🚀 Starting telemetry sync for machine:', machine.id);
    const sync = startGlobalTelemetrySync(machine.id);
    
    sync.onError((error) => {
      console.error('❌ Telemetry sync error:', error);
    });

    sync.onSuccess((data) => {
      console.log('✅ Telemetry synced:', data.mth);
    });

    telemetrySyncStarted.current = true;

    return () => {
      console.log('🛑 Stopping telemetry sync');
      stopGlobalTelemetrySync();
      telemetrySyncStarted.current = false;
    };
  }, [machine]);

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
        {/* Branding */}
        <header className="text-center">
          <h1 className="text-lg font-bold tracking-wide text-foreground">
            e-ManuAI <span className="text-muted-foreground">•</span> by <span className="text-muted-foreground">•</span> Dominik Schmied
          </h1>
        </header>

        {/* MTH Display - Hero section */}
        <section aria-label="Aktuální stav motoru">
          <MthDisplay machine={machine} />
        </section>

        {/* Quick actions - horizontal scroll */}
        <section aria-label="Rychlé akce">
          <QuickActionsCard />
        </section>

        {/* Machine status */}
        <section aria-label="Stav stroje">
          <MachineStatusCard machine={machine} />
        </section>

        {/* NEW: Service Status Card */}
        <section aria-labelledby="service-status-heading">
          <h2 id="service-status-heading" className="section-heading mb-3">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Servisní stav
          </h2>
          <ServiceStatusCard 
            strojId={machine.id} 
            currentMth={machine.aktualni_mth} 
          />
        </section>

        {/* NEW: Realtime Map */}
        <section aria-labelledby="realtime-map-heading">
          <h2 id="realtime-map-heading" className="section-heading mb-3">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Live Tracking
          </h2>
          <RealtimeMap 
            strojId={machine.id}
            height="500px"
            showTrail={true}
            trailHours={1}
            autoCenter={false}
          />
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
