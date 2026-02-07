import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, CheckCircle, Clock, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AreaStatsProps {
  machineId: string;
}

export function AreaStats({ machineId }: AreaStatsProps) {
  const { data: areas } = useQuery({
    queryKey: ['areas-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arealy')
        .select('id, nazev, plocha_m2');
      if (error) throw error;
      return data;
    },
  });

  // Fetch mowing sessions to determine which areas have been serviced recently
  const { data: sessions } = useQuery({
    queryKey: ['sessions-stats', machineId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('seceni_relace')
        .select('areal_id, plocha_posekana_m2, datum_cas_start')
        .eq('stroj_id', machineId)
        .gte('datum_cas_start', thirtyDaysAgo.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!machineId,
  });

  const totalAreas = areas?.length || 0;
  const totalAreaM2 = areas?.reduce((sum, a) => sum + (a.plocha_m2 || 0), 0) || 0;

  // Areas mowed in last 30 days
  const mowedAreaIds = new Set(sessions?.map(s => s.areal_id).filter(Boolean) || []);
  const mowedCount = mowedAreaIds.size;
  const mowedPercent = totalAreas > 0 ? Math.round((mowedCount / totalAreas) * 100) : 0;

  const totalMowedM2 = sessions?.reduce((sum, s) => sum + (s.plocha_posekana_m2 || 0), 0) || 0;
  const remainingM2 = Math.max(0, totalAreaM2 - totalMowedM2);

  return (
    <div className="dashboard-widget">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Provozní statistiky (30 dní)
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Mowed areas percentage */}
        <div className="rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Hotové areály</span>
          </div>
          <div className="mt-1 flex items-end gap-1">
            <span className="font-mono text-2xl font-bold text-success">{mowedPercent}</span>
            <span className="mb-1 text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{mowedCount} z {totalAreas}</p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${mowedPercent}%` }} />
          </div>
        </div>

        {/* Mowed area */}
        <div className="rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-info" />
            <span className="text-xs text-muted-foreground">Posekáno</span>
          </div>
          <div className="mt-1 flex items-end gap-1">
            <span className="font-mono text-2xl font-bold text-info">
              {totalMowedM2.toLocaleString('cs-CZ')}
            </span>
            <span className="mb-1 text-sm text-muted-foreground">m²</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Zbývá: {remainingM2.toLocaleString('cs-CZ')} m²
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-info transition-all"
              style={{ width: `${totalAreaM2 > 0 ? Math.min(100, (totalMowedM2 / totalAreaM2) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
