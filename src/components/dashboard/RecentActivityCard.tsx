import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Clock, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

interface RecentActivityCardProps {
  machineId: string;
}

export function RecentActivityCard({ machineId }: RecentActivityCardProps) {
  // Fetch recent service records
  const { data: recentServices, isLoading } = useQuery({
    queryKey: ['recent-services', machineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servisni_zaznamy')
        .select('id, datum_servisu, typ_zasahu, popis, mth_pri_servisu')
        .eq('stroj_id', machineId)
        .eq('is_deleted', false)
        .order('datum_servisu', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="dashboard-widget">
        <Skeleton className="mb-3 h-5 w-40" />
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Poslední servisní záznamy
        </h3>
        <Link 
          to="/servis" 
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Zobrazit vše
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {recentServices && recentServices.length > 0 ? (
        <div className="space-y-2">
          {recentServices.map((service) => (
            <Link
              key={service.id}
              to={`/servis/${service.id}`}
              className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
            >
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded bg-muted">
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium capitalize">
                    {service.typ_zasahu}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {service.mth_pri_servisu} mth
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {service.popis}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(service.datum_servisu), { 
                    addSuffix: true,
                    locale: cs 
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Wrench className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Zatím žádné servisní záznamy
          </p>
          <Link 
            to="/servis/novy"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Přidat první záznam
          </Link>
        </div>
      )}
    </div>
  );
}
