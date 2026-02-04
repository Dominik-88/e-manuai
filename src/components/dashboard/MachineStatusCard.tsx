import React from 'react';
import type { Stroj } from '@/types/database';
import { Cpu, Radio, Gauge, Wrench } from 'lucide-react';

interface MachineStatusCardProps {
  machine: Stroj;
}

export function MachineStatusCard({ machine }: MachineStatusCardProps) {
  const specs = [
    {
      icon: Cpu,
      label: 'Procesor',
      value: machine.procesor || 'N/A',
    },
    {
      icon: Radio,
      label: 'GNSS',
      value: machine.gnss_modul || 'N/A',
    },
    {
      icon: Gauge,
      label: 'Záběr',
      value: `${machine.sirka_zaberu_cm} cm`,
    },
    {
      icon: Wrench,
      label: 'Compass',
      value: machine.compass_servo_drive_version || 'N/A',
    },
  ];

  return (
    <div className="dashboard-widget">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Technické specifikace
      </h3>
      
      <div className="space-y-3">
        {specs.map((spec) => (
          <div key={spec.label} className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
              <spec.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{spec.label}</p>
              <p className="font-mono text-sm">{spec.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard link */}
      {machine.dashboard_url && (
        <div className="mt-4 border-t border-border pt-3">
          <a 
            href={machine.dashboard_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <span>Dashboard stroje</span>
            <code className="font-mono text-xs text-muted-foreground">
              {machine.dashboard_url}
            </code>
          </a>
        </div>
      )}
    </div>
  );
}
