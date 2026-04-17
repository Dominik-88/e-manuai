import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AreaPriority = 'done-today' | 'ok' | 'medium' | 'high' | 'never';

export interface AreaStatus {
  arealId: string;
  lastMowedAt: string | null;
  lastSessionId: string | null;
  daysSince: number | null;
  isMowedToday: boolean;
  priority: AreaPriority;
}

const PRIORITY_THRESHOLDS = {
  ok: 7,
  medium: 14,
};

export function classifyPriority(daysSince: number | null, isMowedToday: boolean): AreaPriority {
  if (isMowedToday) return 'done-today';
  if (daysSince === null) return 'never';
  if (daysSince <= PRIORITY_THRESHOLDS.ok) return 'ok';
  if (daysSince <= PRIORITY_THRESHOLDS.medium) return 'medium';
  return 'high';
}

export function useAreaStatuses() {
  return useQuery({
    queryKey: ['area-statuses'],
    queryFn: async (): Promise<Record<string, AreaStatus>> => {
      // Fetch latest seceni_relace per areal
      const { data, error } = await supabase
        .from('seceni_relace')
        .select('id, areal_id, datum_cas_konec, datum_cas_start')
        .not('areal_id', 'is', null)
        .order('datum_cas_start', { ascending: false });

      if (error) throw error;

      const statuses: Record<string, AreaStatus> = {};
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const now = Date.now();

      for (const row of data || []) {
        if (!row.areal_id) continue;
        if (statuses[row.areal_id]) continue; // we already have the latest

        const refTime = row.datum_cas_konec || row.datum_cas_start;
        const refDate = new Date(refTime);
        const daysSince = Math.floor((now - refDate.getTime()) / (1000 * 60 * 60 * 24));
        const isMowedToday = refDate >= todayStart;

        statuses[row.areal_id] = {
          arealId: row.areal_id,
          lastMowedAt: refTime,
          lastSessionId: row.id,
          daysSince,
          isMowedToday,
          priority: classifyPriority(daysSince, isMowedToday),
        };
      }

      return statuses;
    },
    staleTime: 30_000,
  });
}

export function getStatusForArea(
  statuses: Record<string, AreaStatus> | undefined,
  arealId: string
): AreaStatus {
  return (
    statuses?.[arealId] ?? {
      arealId,
      lastMowedAt: null,
      lastSessionId: null,
      daysSince: null,
      isMowedToday: false,
      priority: 'never',
    }
  );
}
