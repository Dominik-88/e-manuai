import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Filter, Wrench, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useMachine } from '@/hooks/useMachine';
import { formatDistanceToNow, format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ServicePage() {
  const { machine } = useMachine();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', machine?.id],
    queryFn: async () => {
      if (!machine) return [];
      
      const { data, error } = await supabase
        .from('servisni_zaznamy')
        .select(`
          *,
          arealy (nazev)
        `)
        .eq('stroj_id', machine.id)
        .eq('is_deleted', false)
        .order('datum_servisu', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!machine,
  });

  const filteredServices = services?.filter(service =>
    service.popis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provedl_osoba.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.typ_zasahu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypBadgeColor = (typ: string) => {
    switch (typ) {
      case 'preventivní': return 'bg-success/20 text-success border-success/30';
      case 'oprava': return 'bg-warning/20 text-warning border-warning/30';
      case 'porucha': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Servisní knížka</h1>
          <p className="text-muted-foreground">
            Historie a evidence servisních zásahů
          </p>
        </div>
        <Button asChild className="touch-target">
          <Link to="/servis/novy">
            <Plus className="mr-2 h-5 w-5" />
            Nový záznam
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Hledat v servisech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10"
          />
        </div>
        <Button variant="outline" size="icon" className="h-12 w-12">
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Service list */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : filteredServices && filteredServices.length > 0 ? (
        <div className="space-y-3">
          {filteredServices.map(service => (
            <Link
              key={service.id}
              to={`/servis/${service.id}`}
              className="dashboard-widget block transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn('capitalize', getTypBadgeColor(service.typ_zasahu))}
                    >
                      {service.typ_zasahu}
                    </Badge>
                    <span className="font-mono text-sm text-muted-foreground">
                      {service.mth_pri_servisu} mth
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{service.popis}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(service.datum_servisu), 'd. M. yyyy', { locale: cs })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {service.provedl_osoba}
                    </span>
                    {service.arealy && (
                      <span className="flex items-center gap-1">
                        📍 {service.arealy.nazev}
                      </span>
                    )}
                  </div>
                </div>
                <Wrench className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="dashboard-widget text-center py-12">
          <Wrench className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Žádné servisní záznamy</h3>
          <p className="mt-1 text-muted-foreground">
            Začněte přidáním prvního servisního záznamu
          </p>
          <Button asChild className="mt-4">
            <Link to="/servis/novy">
              <Plus className="mr-2 h-4 w-4" />
              Přidat záznam
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
