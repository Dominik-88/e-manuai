import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ServisniInterval } from '@/types/database';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface ServiceIntervalsOverviewProps {
  machineId: string;
  currentMth: number;
}

interface IntervalWithStatus extends ServisniInterval {
  lastServiceMth: number;
  remainingMth: number;
  nextServiceMth: number;
  status: 'ok' | 'warning' | 'critical';
  percentRemaining: number;
}

export function ServiceIntervalsOverview({ machineId, currentMth }: ServiceIntervalsOverviewProps) {
  // Fetch intervals
  const { data: intervals } = useQuery({
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

  // Fetch last service for each interval type
  const { data: lastServices } = useQuery({
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

  // Calculate status for each interval
  const intervalsWithStatus: IntervalWithStatus[] = React.useMemo(() => {
    if (!intervals) return [];

    return intervals.map(interval => {
      // Find last service for this interval
      const lastService = lastServices?.find(s => s.servisni_interval_id === interval.id);
      const lastServiceMth = lastService?.mth_pri_servisu || 0;

      // Special case: first oil change is at 50 mth
      const isFirstService = lastServiceMth === 0;
      const effectiveInterval = isFirstService && interval.prvni_servis_mth
        ? interval.prvni_servis_mth
        : interval.interval_mth;

      const nextServiceMth = lastServiceMth + effectiveInterval;
      const remainingMth = nextServiceMth - currentMth;
      const percentRemaining = Math.max(0, Math.min(100, (remainingMth / effectiveInterval) * 100));

      // Determine status based on percentage remaining
      let status: 'ok' | 'warning' | 'critical';
      if (remainingMth <= 0) {
        status = 'critical'; // Overdue
      } else if (percentRemaining <= 10) {
        status = 'critical'; // Less than 10% remaining
      } else if (percentRemaining <= 25) {
        status = 'warning'; // Less than 25% remaining
      } else {
        status = 'ok';
      }

      return {
        ...interval,
        lastServiceMth,
        remainingMth,
        nextServiceMth,
        status,
        percentRemaining,
      };
    });
  }, [intervals, lastServices, currentMth]);

  // Summary counts
  const summary = {
    ok: intervalsWithStatus.filter(i => i.status === 'ok').length,
    warning: intervalsWithStatus.filter(i => i.status === 'warning').length,
    critical: intervalsWithStatus.filter(i => i.status === 'critical').length,
  };

  const statusConfig = {
    ok: {
      icon: CheckCircle,
      bgColor: 'bg-success/20',
      borderColor: 'border-l-success',
      textColor: 'text-success',
      progressColor: 'bg-success',
    },
    warning: {
      icon: Clock,
      bgColor: 'bg-warning/20',
      borderColor: 'border-l-warning',
      textColor: 'text-warning',
      progressColor: 'bg-warning',
    },
    critical: {
      icon: AlertTriangle,
      bgColor: 'bg-destructive/20',
      borderColor: 'border-l-destructive',
      textColor: 'text-destructive',
      progressColor: 'bg-destructive',
    },
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
          <CheckCircle className="h-6 w-6 text-success" />
          <div>
            <span className="text-2xl font-bold text-success">{summary.ok}</span>
            <p className="text-xs text-muted-foreground">v pořádku</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3">
          <Clock className="h-6 w-6 text-warning" />
          <div>
            <span className="text-2xl font-bold text-warning">{summary.warning}</span>
            <p className="text-xs text-muted-foreground">blíží se</p>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-2 rounded-lg bg-destructive/10 p-3',
          summary.critical > 0 && 'critical-alert'
        )}>
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <span className="text-2xl font-bold text-destructive">{summary.critical}</span>
            <p className="text-xs text-muted-foreground">kritické</p>
          </div>
        </div>
      </div>

      {/* Critical alerts */}
      {intervalsWithStatus.filter(i => i.status === 'critical').length > 0 && (
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Upozornění na kritické servisy</span>
          </div>
          <div className="space-y-2">
            {intervalsWithStatus.filter(i => i.status === 'critical').map(interval => (
              <div key={interval.id} className="flex items-center justify-between text-sm">
                <span>{interval.nazev}</span>
                <span className="font-mono font-medium text-destructive">
                  {interval.remainingMth <= 0 
                    ? `PO TERMÍNU o ${Math.abs(interval.remainingMth).toFixed(0)} mth!`
                    : `za ${interval.remainingMth.toFixed(0)} mth`
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interval list */}
      <div className="space-y-2">
        {intervalsWithStatus.map(interval => {
          const config = statusConfig[interval.status];
          const Icon = config.icon;

          return (
            <div
              key={interval.id}
              className={cn(
                'rounded-lg border-l-4 bg-card p-3',
                config.borderColor,
                interval.status === 'critical' && 'critical-alert'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', config.textColor)} />
                    <span className="font-medium">{interval.nazev}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Interval: {interval.interval_mth} mth
                    {interval.prvni_servis_mth && ` (první: ${interval.prvni_servis_mth} mth)`}
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn('font-mono text-sm font-medium', config.textColor)}>
                    {interval.remainingMth > 0 
                      ? `${interval.remainingMth.toFixed(0)} mth`
                      : 'PO TERMÍNU!'
                    }
                  </span>
                  <p className="text-xs text-muted-foreground">
                    další ~{interval.nextServiceMth.toFixed(0)} mth
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', config.progressColor)}
                    style={{ width: `${interval.percentRemaining}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Link to service page */}
      <Link
        to="/servis"
        className="flex items-center justify-center gap-2 rounded-lg border border-border p-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        Zobrazit kompletní servisní historii
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
