import React from 'react';
import { useMachine } from '@/hooks/useMachine';
import { useServiceIntervals } from '@/hooks/useServiceIntervals';
import { MthDisplay } from '@/components/dashboard/MthDisplay';
import { ServiceIntervalCard } from '@/components/dashboard/ServiceIntervalCard';
import { MachineStatusCard } from '@/components/dashboard/MachineStatusCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { machine, loading: machineLoading } = useMachine();
  const { intervals, loading: intervalsLoading } = useServiceIntervals(machine?.id);

  if (machineLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <span className="text-4xl">🚜</span>
        </div>
        <h2 className="text-xl font-semibold">Žádný stroj není k dispozici</h2>
        <p className="mt-2 text-muted-foreground">
          Kontaktujte administrátora pro přidání stroje.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* MTH Display - Hero section */}
      <MthDisplay machine={machine} />

      {/* Quick actions + Machine status */}
      <div className="grid gap-4 md:grid-cols-2">
        <QuickActionsCard />
        <MachineStatusCard machine={machine} />
      </div>

      {/* Service intervals */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Servisní intervaly</h2>
        {intervalsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {intervals.map((interval) => (
              <ServiceIntervalCard 
                key={interval.id} 
                interval={interval} 
                currentMth={machine.aktualni_mth}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <RecentActivityCard machineId={machine.id} />
    </div>
  );
}
