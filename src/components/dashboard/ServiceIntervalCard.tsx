import React from 'react';
import { Link } from 'react-router-dom';
import type { ServisniInterval } from '@/types/database';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ServiceIntervalCardProps {
  interval: ServisniInterval;
  currentMth: number;
  lastServiceMth?: number;
}

export function ServiceIntervalCard({ 
  interval, 
  currentMth,
  lastServiceMth = 0 
}: ServiceIntervalCardProps) {
  // Calculate next service MTH
  // Special case: first oil change is at 50 mth
  const isFirstService = lastServiceMth === 0;
  const effectiveInterval = isFirstService && interval.prvni_servis_mth 
    ? interval.prvni_servis_mth 
    : interval.interval_mth;
  
  const nextServiceMth = lastServiceMth + effectiveInterval;
  const remainingMth = nextServiceMth - currentMth;
  const percentRemaining = Math.max(0, Math.min(100, (remainingMth / effectiveInterval) * 100));

  // Determine status
  let status: 'ok' | 'warning' | 'critical';
  if (remainingMth <= 0) {
    status = 'critical';
  } else if (remainingMth <= effectiveInterval * 0.2) { // Less than 20% remaining
    status = 'warning';
  } else {
    status = 'ok';
  }

  const statusConfig = {
    ok: {
      icon: CheckCircle,
      bgColor: 'border-l-success',
      textColor: 'text-success',
      progressColor: 'bg-success',
    },
    warning: {
      icon: Clock,
      bgColor: 'border-l-warning',
      textColor: 'text-warning',
      progressColor: 'bg-warning',
    },
    critical: {
      icon: AlertTriangle,
      bgColor: 'border-l-destructive',
      textColor: 'text-destructive',
      progressColor: 'bg-destructive',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Link 
      to={`/servis/interval/${interval.id}`}
      className={cn(
        'dashboard-widget block transition-all hover:scale-[1.02]',
        '!border-l-4',
        config.bgColor,
        status === 'critical' && 'critical-alert'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{interval.nazev}</h3>
          <p className="text-xs text-muted-foreground">
            Interval: {interval.interval_mth} mth
            {interval.prvni_servis_mth && ` (první: ${interval.prvni_servis_mth} mth)`}
          </p>
        </div>
        <Icon className={cn('h-5 w-5', config.textColor)} />
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Zbývá</span>
          <span className={cn('font-mono font-medium', config.textColor)}>
            {remainingMth > 0 ? `${remainingMth.toFixed(0)} mth` : 'PO TERMÍNU!'}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div 
            className={cn('h-full rounded-full transition-all', config.progressColor)}
            style={{ width: `${percentRemaining}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Další: ~{nextServiceMth.toFixed(0)} mth</span>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase',
          interval.kriticnost === 'kritické' && 'bg-destructive/20 text-destructive',
          interval.kriticnost === 'důležité' && 'bg-warning/20 text-warning',
          interval.kriticnost === 'normální' && 'bg-muted text-muted-foreground',
        )}>
          {interval.kriticnost}
        </span>
      </div>
    </Link>
  );
}
