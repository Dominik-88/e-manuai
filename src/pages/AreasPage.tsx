import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, MapPin, ExternalLink, FileSpreadsheet, X, Map, List, Ruler, Fence, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { OKRES_NAMES } from '@/types/database';
import type { OkresCode, TypArealu } from '@/types/database';
import { exportAreasToExcel } from '@/lib/export';
import { toast } from 'sonner';
import { AreasMap } from '@/components/map/AreasMap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AreasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterTyp, setFilterTyp] = useState<string>('all');
  const [filterOkres, setFilterOkres] = useState<string>('all');

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

  const filteredAreas = useMemo(() => {
    if (!areas) return [];
    return areas.filter(area => {
      const matchesSearch = !searchQuery ||
        area.nazev.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.okres?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTyp = filterTyp === 'all' || area.typ === filterTyp;
      const matchesOkres = filterOkres === 'all' || area.okres === filterOkres;
      return matchesSearch && matchesTyp && matchesOkres;
    });
  }, [areas, searchQuery, filterTyp, filterOkres]);

  const totalArea = areas?.reduce((sum, a) => sum + (a.plocha_m2 || 0), 0) || 0;
  const totalFence = areas?.reduce((sum, a) => sum + (a.obvod_oploceni_m || 0), 0) || 0;

  // Get unique types and okresy for filters
  const uniqueTypes = useMemo(() => {
    if (!areas) return [];
    return [...new Set(areas.map(a => a.typ).filter(Boolean))].sort();
  }, [areas]);

  const uniqueOkresy = useMemo(() => {
    if (!areas) return [];
    return [...new Set(areas.map(a => a.okres).filter(Boolean))].sort() as string[];
  }, [areas]);

  const handleExportExcel = async () => {
    if (!areas?.length) {
      toast.error('Žádné areály k exportu');
      return;
    }
    try {
      await exportAreasToExcel(areas);
      toast.success('Excel byl úspěšně stažen');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Chyba při exportu');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Areály</h1>
          <p className="text-muted-foreground">
            {areas?.length || 0} objektů · {(totalArea / 10000).toFixed(1)} ha · {totalFence.toLocaleString('cs-CZ')} bm
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="h-14 gap-2" aria-label="Export do Excelu">
            <FileSpreadsheet className="h-5 w-5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button asChild className="h-14 gap-2">
            <Link to="/arealy/novy">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nový</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Search with clear */}
      <div className="relative" role="search">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Hledat areály..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-14 pl-10 pr-10 text-base"
          aria-label="Hledat v areálech"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Vymazat hledání"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterTyp} onValueChange={setFilterTyp}>
          <SelectTrigger className="h-10 w-[160px]">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            {uniqueTypes.map(t => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterOkres} onValueChange={setFilterOkres}>
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue placeholder="Okres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny okresy</SelectItem>
            {uniqueOkresy.map(o => (
              <SelectItem key={o} value={o}>
                {OKRES_NAMES[o as OkresCode] || o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterTyp !== 'all' || filterOkres !== 'all') && (
          <Button variant="ghost" size="sm" className="h-10" onClick={() => { setFilterTyp('all'); setFilterOkres('all'); }}>
            <X className="mr-1 h-3.5 w-3.5" /> Zrušit filtry
          </Button>
        )}
      </div>

      {/* Results count */}
      {(searchQuery || filterTyp !== 'all' || filterOkres !== 'all') && filteredAreas && (
        <p className="text-sm text-muted-foreground">
          Nalezeno: {filteredAreas.length} {filteredAreas.length === 1 ? 'areál' : 'areálů'}
        </p>
      )}

      {/* View toggle: List / Map */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="h-10 gap-1.5"
        >
          <List className="h-4 w-4" />
          Seznam
        </Button>
        <Button
          variant={viewMode === 'map' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('map')}
          className="h-10 gap-1.5"
        >
          <Map className="h-4 w-4" />
          Mapa
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-primary/10 p-3 text-center">
          <span className="text-2xl font-bold text-primary">{areas?.length || 0}</span>
          <p className="text-xs text-muted-foreground">areálů</p>
        </div>
        <div className="rounded-lg bg-success/10 p-3 text-center">
          <span className="text-2xl font-bold text-success">{(totalArea / 10000).toFixed(1)}</span>
          <p className="text-xs text-muted-foreground">ha celkem</p>
        </div>
        <div className="rounded-lg bg-info/10 p-3 text-center">
          <span className="text-2xl font-bold text-info">{(totalFence / 1000).toFixed(1)}</span>
          <p className="text-xs text-muted-foreground">km oplocení</p>
        </div>
      </div>

      {/* Map view */}
      {viewMode === 'map' && filteredAreas && (
        <AreasMap areas={filteredAreas} />
      )}

      {/* Areas list */}
      {viewMode === 'list' && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : filteredAreas && filteredAreas.length > 0 ? (
            <div className="space-y-3">
              {filteredAreas.map(area => (
                <div key={area.id} className="dashboard-widget">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{area.nazev}</h3>
                        {area.okres && (
                          <Badge variant="outline" className="text-xs">
                            {OKRES_NAMES[area.okres as OkresCode] || area.okres}
                          </Badge>
                        )}
                        {area.kategorie_travnate_plochy && (
                          <Badge variant="secondary" className="text-xs">
                            kat. {area.kategorie_travnate_plochy}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3.5 w-3.5" />
                          {area.plocha_m2?.toLocaleString('cs-CZ') || '?'} m²
                        </span>
                        <span className="flex items-center gap-1">
                          <Fence className="h-3.5 w-3.5" />
                          {area.obvod_oploceni_m || 0} bm
                        </span>
                        <span className="capitalize">
                          <MapPin className="mr-0.5 inline h-3.5 w-3.5" />
                          {area.typ}
                        </span>
                      </div>

                      {area.stroje && (
                        <div className="mt-2 text-sm text-success">
                          Stroj: {(area.stroje as any).vyrobni_cislo}
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
                          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                          aria-label={`Otevřít ${area.nazev} na mapě`}
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
            <div className="dashboard-widget py-16 text-center">
              <MapPin className="mx-auto h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-xl font-semibold">
                {searchQuery ? 'Žádné výsledky' : 'Žádné areály'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery
                  ? `Pro "${searchQuery}" nebyly nalezeny žádné areály`
                  : 'Přidejte první areál pro sledování prací'
                }
              </p>
              {!searchQuery && (
                <Button asChild className="mt-6 h-14">
                  <Link to="/arealy/novy">
                    <Plus className="mr-2 h-5 w-5" />
                    Přidat areál
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
