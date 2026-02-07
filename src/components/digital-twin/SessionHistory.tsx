import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, MapPin, Gauge, Navigation, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SessionHistoryProps {
  machineId: string;
}

export function SessionHistory({ machineId }: SessionHistoryProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['mowing-sessions', machineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seceni_relace')
        .select('*, arealy(nazev)')
        .eq('stroj_id', machineId)
        .order('datum_cas_start', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!machineId,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('seceni_relace')
        .delete()
        .eq('id', deleteId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['mowing-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions-stats'] });
      toast.success('Relace smazána');
    } catch (err: any) {
      toast.error('Chyba při mazání: ' + (err.message || 'Neznámá chyba'));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (isLoading) return null;
  if (!sessions?.length) return null;

  return (
    <div className="dashboard-widget">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Historie sečení
      </h3>
      <div className="space-y-2">
        {sessions.map((s: any) => {
          const duration = s.datum_cas_konec
            ? Math.round((new Date(s.datum_cas_konec).getTime() - new Date(s.datum_cas_start).getTime()) / 60000)
            : null;
          const hasTrajectory = !!s.trajektorie_geojson;

          return (
            <div key={s.id} className="group flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                hasTrajectory ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
              )}>
                {hasTrajectory ? <Navigation className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {(s.arealy as any)?.nazev || 'Bez areálu'}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(s.datum_cas_start).toLocaleDateString('cs-CZ')}</span>
                  {duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {duration} min
                    </span>
                  )}
                  {s.plocha_posekana_m2 && (
                    <span>{s.plocha_posekana_m2.toLocaleString('cs-CZ')} m²</span>
                  )}
                  {s.prumerna_rychlost_kmh && (
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3 w-3" />
                      {s.prumerna_rychlost_kmh} km/h
                    </span>
                  )}
                </div>
              </div>
              {hasTrajectory && (
                <div className="text-xs text-success">GPS ✓</div>
              )}
              <button
                onClick={() => setDeleteId(s.id)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label="Smazat relaci"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat relaci sečení?</AlertDialogTitle>
            <AlertDialogDescription>
              Tuto akci nelze vrátit zpět. Data o trase a ploše budou ztracena.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
