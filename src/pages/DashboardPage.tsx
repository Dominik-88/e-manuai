import React from 'react';
import { useMachine } from '@/hooks/useMachine';
import { MthDisplay } from '@/components/dashboard/MthDisplay';
import { MachineStatusCard } from '@/components/dashboard/MachineStatusCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { QuickServiceConfirm } from '@/components/dashboard/QuickServiceConfirm';
import { AreaStats } from '@/components/dashboard/AreaStats';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { ServiceIntervalsOverview } from '@/components/dashboard/ServiceIntervalsOverview';
import { TelemetryLive } from '@/components/dashboard/TelemetryLive';
import { MowingSessionRecorder } from '@/components/digital-twin/MowingSessionRecorder';
import { SessionHistory } from '@/components/digital-twin/SessionHistory';
import { AIDiagnostics } from '@/components/diagnostics/AIDiagnostics';
import { OfflineBanner } from '@/components/layout/OfflineIndicator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Activity, Cpu } from 'lucide-react';

export default function DashboardPage() {
  const { machine, loading: machineLoading } = useMachine();

  if (machineLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="shimmer h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="shimmer h-48" />
          <div className="shimmer h-48" />
        </div>
        <div className="shimmer h-64" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
          <span className="text-4xl">🚜</span>
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
        {/* MTH Display - Hero section */}
        <MthDisplay machine={machine} />

        {/* Quick actions - horizontal scroll */}
        <QuickActionsCard />

        {/* Quick service confirmation */}
        <QuickServiceConfirm />

        {/* Machine status */}
        <MachineStatusCard machine={machine} />

        {/* Service intervals with color indicators */}
        <div>
          <h2 className="section-heading mb-3">
            <Activity className="h-4 w-4" />
            Servisní intervaly
          </h2>
          <ServiceIntervalsOverview
            machineId={machine.id}
            currentMth={machine.aktualni_mth}
          />
        </div>

        {/* Area stats */}
        <AreaStats machineId={machine.id} />

        {/* Recent activity */}
        <RecentActivityCard machineId={machine.id} />

        {/* Collapsible: Digital Twin */}
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
            <span className="section-heading">
              <Cpu className="h-4 w-4" />
              Digital Twin & Telemetrie
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-4">
            <MowingSessionRecorder machineId={machine.id} currentMth={machine.aktualni_mth} />
            <SessionHistory machineId={machine.id} />
            <TelemetryLive />
          </CollapsibleContent>
        </Collapsible>

        {/* AI Diagnostics */}
        <AIDiagnostics />
      </div>
    </>
  );
}
