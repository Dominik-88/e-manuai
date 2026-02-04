import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { OKRES_NAMES } from '@/types/database';
import type { OkresCode } from '@/types/database';

export default function AreasPage() {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arealy')
        .select(`
          *,
          stroje (vyrobni_cislo, model)
        `)
        .order('nazev');

      if (error) throw error;
      return data;
    },
  });

  const filteredAreas = areas?.filter(area =>
    area.nazev.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.okres?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalArea = areas?.reduce((sum, a) => sum + (a.plocha_m2 || 0), 0) || 0;
  const totalFence = areas?.reduce((sum, a) => sum + (a.obvod_oploceni_m || 0), 0) || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Areály</h1>
          <p className="text-muted-foreground">
            {areas?.length || 0} objektů | {(totalArea / 10000).toFixed(1)} ha | {totalFence.toLocaleString()} bm oplocení
          </p>
        </div>
        <Button asChild className="touch-target">
          <Link to="/arealy/novy">
            <Plus className="mr-2 h-5 w-5" />
            Nový areál
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Hledat areály..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10"
        />
      </div>

      {/* Areas list */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : filteredAreas && filteredAreas.length > 0 ? (
        <div className="space-y-3">
          {filteredAreas.map(area => (
            <div
              key={area.id}
              className="dashboard-widget"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{area.nazev}</h3>
                    {area.okres && (
                      <Badge variant="outline" className="text-xs">
                        {OKRES_NAMES[area.okres as OkresCode] || area.okres}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>📐 {area.plocha_m2?.toLocaleString() || '?'} m²</span>
                    <span>🔲 {area.obvod_oploceni_m || 0} m plot</span>
                    <span className="capitalize">🏷️ {area.typ}</span>
                  </div>

                  {area.stroje && (
                    <div className="mt-2 text-sm text-success">
                      🚜 {area.stroje.vyrobni_cislo}
                    </div>
                  )}

                  {area.poznamky && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                      {area.poznamky}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {area.google_maps_link && (
                    <a 
                      href={area.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <MapPin className="h-4 w-4" />
                      Mapa
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {area.gps_latitude && area.gps_longitude && (
                    <div className="text-right font-mono text-[10px] text-muted-foreground">
                      {area.gps_latitude.toFixed(4)}°N<br />
                      {area.gps_longitude.toFixed(4)}°E
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-widget py-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">Žádné areály</h3>
          <p className="mt-1 text-muted-foreground">
            Přidejte první areál pro sledování prací
          </p>
          <Button asChild className="mt-4">
            <Link to="/arealy/novy">
              <Plus className="mr-2 h-4 w-4" />
              Přidat areál
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
