import React from 'react';
import { Link } from 'react-router-dom';
import type { Stroj } from '@/types/database';
import { cn } from '@/lib/utils';
import { TrendingUp, Clock, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MthDisplayProps {
  machine: Stroj;
}

export function MthDisplay({ machine }: MthDisplayProps) {
  const lastUpdated = machine.datum_posledni_aktualizace_mth
    ? new Date(machine.datum_posledni_aktualizace_mth).toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Neznámé';

  return (
    <div className="dashboard-widget !border-l-4 !border-l-primary">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Motohodiny (MTH)</span>
          </div>
          <div className="mth-display text-foreground">
            {machine.aktualni_mth.toFixed(1)}
            <span className="ml-2 text-lg font-normal text-muted-foreground">h</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Poslední aktualizace: {lastUpdated}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={cn(
            'status-bar',
            machine.stav === 'aktivní' && 'border-success/30',
            machine.stav === 'v_servisu' && 'border-warning/30',
            machine.stav === 'vyřazeno' && 'border-destructive/30',
          )}>
            <div className={cn(
              'led-indicator',
              machine.stav === 'aktivní' && 'led-green',
              machine.stav === 'v_servisu' && 'led-orange',
              machine.stav === 'vyřazeno' && 'led-red',
            )} />
            <span className="text-xs font-medium capitalize">
              {machine.stav.replace('_', ' ')}
            </span>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
            <Link to="/nastaveni">
              <Edit2 className="h-3 w-3" />
              <span className="text-xs">Upravit MTH</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground">
            Model: <span className="font-medium text-foreground">{machine.model}</span>
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          S/N: <span className="font-mono text-foreground">{machine.vyrobni_cislo}</span>
        </div>
      </div>
    </div>
  );
}
