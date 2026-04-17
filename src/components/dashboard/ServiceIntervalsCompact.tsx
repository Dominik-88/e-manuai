import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ServisniInterval } from '@/types/database';
import { SERVICE_THRESHOLDS } from '@/types/database';
import { cn } from '@/lib/utils';
import { Wrench, ArrowRight, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface ServiceIntervalsCompactProps {
  machineId: string;
  currentMth: number;
}

interface CompactInterval {
  id: string;
  nazev: string;
  remainingMth: number;
  percentRemaining: number;
  status: 'ok' | 'warning' | 'critical';
}

const statusStyles = {
  ok: { bar: 'bg-success', text: 'text-success', Icon: CheckCircle },
  warning: { bar: 'bg-warning', text: 'text-warning', Icon: Clock },
  critical: { bar: 'bg-destructive', text: 'text-destructive', Icon: AlertTriangle },
} as const;

export function ServiceIntervalsCompact({ machineId, currentMth }: ServiceIntervalsCompactProps) {
  const { data: intervals, isLoading: intervalsLoading } = useQuery({
    queryKey: ['service-intervals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servisni_intervaly')
        .select('*')
        .order('kriticnost', { ascending: false });
      if (error) throw error;
      return data as ServisniInterval[];
    },
  });

  const { data: lastServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['last-services', machineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servisni_zaznamy')
        .select('servisni_interval_id, mth_pri_servisu, datum_servisu')
        .eq('stroj_id', machineId)
        .eq('is_deleted', false)
        .order('mth_pri_servisu', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!machineId,
  });

  const isLoading = intervalsLoading || servicesLoading;

  const topIntervals: CompactInterval[] = React.useMemo(() => {
    if (!intervals) return [];

    const enriched = intervals.map(interval => {
      const lastService = lastServices?.find(s => s.servisni_interval_id === interval.id);
      const lastServiceMth = lastService?.mth_pri_servisu || 0;

      const isFirstService = lastServiceMth === 0;
      const effectiveInterval =
        isFirstService && interval.prvni_servis_mth
          ? interval.prvni_servis_mth
          : interval.interval_mth;

      const nextServiceMth = lastServiceMth + effectiveInterval;
      const remainingMth = nextServiceMth - currentMth;
      const percentRemaining = Math.max(0, Math.min(100, (remainingMth / effectiveInterval) * 100));

      let status: 'ok' | 'warning' | 'critical';
      if (remainingMth <= SERVICE_THRESHOLDS.WARNING) status = 'critical';
      else if (remainingMth <= SERVICE_THRESHOLDS.OK) status = 'warning';
      else status = 'ok';

      return { id: interval.id, nazev: interval.nazev, remainingMth, percentRemaining, status };
    });

    return enriched.sort((a, b) => a.remainingMth - b.remainingMth).slice(0, 3);
  }, [intervals, lastServices, currentMth]);

  return (
    <div className="dashboard-widget">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-heading">
          <Wrench className="h-4 w-4" aria-hidden="true" />
          Servisní intervaly
        </h2>
        <Link
          to="/servis"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          aria-label="Zobrazit všechny servisní intervaly"
        >
          Vše
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3" role="status" aria-label="Načítání servisních intervalů">
          {[0, 1, 2].map(i => (
            <div key={i} className="shimmer h-6 w-full rounded" />
          ))}
        </div>
      ) : topIntervals.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          Žádné servisní intervaly nejsou nakonfigurovány.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {topIntervals.map(interval => {
            const { bar, text, Icon } = statusStyles[interval.status];
            const isOverdue = interval.remainingMth <= 0;

            return (
              <li
                key={interval.id}
                className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', text)} aria-hidden="true" />
                  <span className="truncate text-sm">{interval.nazev}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(interval.percentRemaining)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Zbývá ${Math.round(interval.percentRemaining)}%`}
                  >
                    <div
                      className={cn('h-full rounded-full transition-all', bar)}
                      style={{ width: `${interval.percentRemaining}%` }}
                    />
                  </div>
                  <span
                    className={cn('w-20 text-right font-mono text-xs font-medium', text)}
                  >
                    {isOverdue
                      ? `−${Math.abs(interval.remainingMth).toFixed(0)} mth`
                      : `${interval.remainingMth.toFixed(0)} mth`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
