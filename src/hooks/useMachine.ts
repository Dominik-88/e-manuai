import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { saveMthUpdate } from '@/lib/offline-queue';
import type { Stroj } from '@/types/database';

export function useMachine() {
  const [machine, setMachine] = useState<Stroj | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMachine = async () => {
    try {
      setLoading(true);
      
      // Fetch the first (primary) machine
      const { data, error: fetchError } = await supabase
        .from('stroje')
        .select('*')
        .eq('stav', 'aktivní')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (fetchError) {
        // If no machine found, that's okay for new setup
        if (fetchError.code === 'PGRST116') {
          setMachine(null);
        } else {
          throw fetchError;
        }
      } else {
        setMachine(data as Stroj);
      }
    } catch (err) {
      console.error('Error fetching machine:', err);
      setError(err instanceof Error ? err.message : 'Chyba při načítání stroje');
    } finally {
      setLoading(false);
    }
  };

  const updateMth = async (newMth: number) => {
    if (!machine) return;

    // Validation: MTH must not decrease
    if (newMth < machine.aktualni_mth) {
      throw new Error(`MTH nesmí klesnout pod ${machine.aktualni_mth}`);
    }

    try {
      const result = await saveMthUpdate(machine.id, newMth);
      
      if (result.offline) {
        console.log('[Machine] MTH update queued for offline sync');
      }

      // Update local state immediately
      setMachine(prev => prev ? { 
        ...prev, 
        aktualni_mth: newMth,
        datum_posledni_aktualizace_mth: new Date().toISOString()
      } : null);
    } catch (err) {
      console.error('Error updating MTH:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMachine();
  }, []);

  return {
    machine,
    loading,
    error,
    refetch: fetchMachine,
    updateMth,
  };
}
