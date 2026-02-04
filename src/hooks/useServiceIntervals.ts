import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ServisniInterval } from '@/types/database';

export function useServiceIntervals(machineId?: string) {
  const [intervals, setIntervals] = useState<ServisniInterval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntervals = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('servisni_intervaly')
        .select('*')
        .order('kriticnost', { ascending: false });

      if (fetchError) throw fetchError;
      
      setIntervals(data as ServisniInterval[]);
    } catch (err) {
      console.error('Error fetching service intervals:', err);
      setError(err instanceof Error ? err.message : 'Chyba při načítání intervalů');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntervals();
  }, [machineId]);

  return {
    intervals,
    loading,
    error,
    refetch: fetchIntervals,
  };
}
