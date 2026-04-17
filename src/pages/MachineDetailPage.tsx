import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMachine } from '@/hooks/useMachine';
import { MachineStatusCard } from '@/components/dashboard/MachineStatusCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function MachineDetailPage() {
  const { machine, loading } = useMachine();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-11 w-11">
          <Link to="/nastaveni" aria-label="Zpět na nastavení">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Technické specifikace</h1>
      </div>

      {loading && (
        <div className="dashboard-widget space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!loading && !machine && (
        <div className="dashboard-widget text-sm text-muted-foreground">
          Žádný aktivní stroj nebyl nalezen.
        </div>
      )}

      {!loading && machine && (
        <>
          <div className="dashboard-widget">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Identifikace
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Model</dt>
                <dd className="font-mono">{machine.model}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Výrobní číslo</dt>
                <dd className="font-mono">{machine.vyrobni_cislo}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Aktuální MTH</dt>
                <dd className="font-mono">{machine.aktualni_mth.toFixed(1)} h</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Stav</dt>
                <dd className="font-mono">{machine.stav}</dd>
              </div>
              {machine.palivo && (
                <div>
                  <dt className="text-xs text-muted-foreground">Palivo</dt>
                  <dd className="font-mono">{machine.palivo}</dd>
                </div>
              )}
              {machine.ram_gb && (
                <div>
                  <dt className="text-xs text-muted-foreground">RAM</dt>
                  <dd className="font-mono">{machine.ram_gb} GB</dd>
                </div>
              )}
            </dl>
          </div>

          <MachineStatusCard machine={machine} />
        </>
      )}
    </div>
  );
}
