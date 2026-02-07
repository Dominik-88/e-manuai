import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, MapPin, ExternalLink, FileSpreadsheet, X, Map, List, Ruler, Fence, Filter, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { OKRES_NAMES } from '@/types/database';
import type { OkresCode, TypArealu } from '@/types/database';
import { exportAreasToExcel } from '@/lib/export';
import { toast } from 'sonner';
import { AreasMap } from '@/components/map/AreasMap';
import { RoutePlanner } from '@/components/route/RoutePlanner';
import { useAuth } from '@/contexts/AuthContext';
import { getTypeConfig } from '@/components/map/AreaMarkerIcon';
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
  const [areaToDelete, setAreaToDelete] = useState<{ id: string; nazev: string } | null>(null);
  const [routeAreas, setRouteAreas] = useState<any[]>([]);

  const { isAdmin, isTechnik } = useAuth();
  const queryClient = useQueryClient();
  const canDelete = isAdmin || isTechnik;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('arealy').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas-full'] });
      toast.success('Areál byl smazán');
      setAreaToDelete(null);
    },
    onError: (error: any) => {
      toast.error('Chyba při mazání areálu: ' + error.message);
    },
  });

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

  const uniqueTypes = useMemo(() => {
    if (!areas) return [];
    return [...new Set(areas.map(a => a.typ).filter(Boolean))].sort();
  }, [areas]);

  const uniqueOkresy = useMemo(() => {
    if (!areas) return [];
    return [...new Set(areas.map(a => a.okres).filter(Boolean))].sort() as string[];
  }, [areas]);

  const handleExportExcel = async () => {
    if (!areas?.length) { toast.error('Žádné areály k exportu'); return; }
    try {
      await exportAreasToExcel(areas);
      toast.success('Excel byl úspěšně stažen');
    } catch { toast.error('Chyba při exportu'); }
  };

  const handleToggleRoute = useCallback((area: any) => {
    setRouteAreas(prev => {
      const exists = prev.find((a: any) => a.id === area.id);
      if (exists) return prev.filter((a: any) => a.id !== area.id);
      return [...prev, area];
    });
  }, []);

  const routeAreaIds = useMemo(() => routeAreas.map((a: any) => a.id), [routeAreas]);

  return (
    <div className="space-y-4">
      {/* Header with inline view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Areály</h1>
            <p className="text-xs text-muted-foreground">
              {areas?.length || 0} objektů · {totalArea.toLocaleString('cs-CZ')} m² · {totalFence.toLocaleString('cs-CZ')} bm
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle inline */}
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setViewMode('list')}
              className={`flex h-10 w-10 items-center justify-center rounded-l-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              aria-label="Zobrazit seznam"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex h-10 w-10 items-center justify-center rounded-r-lg transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              aria-label="Zobrazit mapu"
            >
              <Map className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" onClick={handleExportExcel} size="icon" className="h-10 w-10" aria-label="Export">
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
          <Button asChild size="icon" className="h-10 w-10">
            <Link to="/arealy/novy" aria-label="Nový areál">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Search + Filters in one row */}
      <div className="flex gap-2">
        <div className="relative flex-1" role="search">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Hledat areály..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-9 pr-8 text-sm"
            aria-label="Hledat v areálech"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label="Vymazat">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={filterTyp} onValueChange={setFilterTyp}>
          <SelectTrigger className="h-11 w-[130px] text-xs">
            <Filter className="mr-1 h-3 w-3" />
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
          <SelectTrigger className="hidden h-11 w-[140px] text-xs sm:flex">
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
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => { setFilterTyp('all'); setFilterOkres('all'); }}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Compact stats bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2">
          <span className="font-mono text-sm font-bold text-primary">{filteredAreas?.length || 0}</span>
          <span className="text-[10px] text-muted-foreground">areálů</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2">
          <Ruler className="h-3 w-3 text-success" />
          <span className="font-mono text-sm font-bold text-success">{totalArea.toLocaleString('cs-CZ')}</span>
          <span className="text-[10px] text-muted-foreground">m²</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-info/10 px-3 py-2">
          <Fence className="h-3 w-3 text-info" />
          <span className="font-mono text-sm font-bold text-info">{(totalFence / 1000).toFixed(1)}</span>
          <span className="text-[10px] text-muted-foreground">km</span>
        </div>
      </div>

      {/* Route planner */}
      {filteredAreas && filteredAreas.length > 0 && (
        <RoutePlanner
          areas={filteredAreas}
          routeAreas={routeAreas}
          setRouteAreas={setRouteAreas}
        />
      )}

      {/* Map view */}
      {viewMode === 'map' && filteredAreas && (
        <AreasMap
          areas={filteredAreas}
          routeAreaIds={routeAreaIds}
          onToggleRoute={handleToggleRoute}
          showRoute={routeAreas.length >= 2}
          showMachinePosition={true}
        />
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="shimmer h-24 rounded-xl" />
              ))}
            </div>
          ) : filteredAreas && filteredAreas.length > 0 ? (
            <div className="space-y-2">
              {filteredAreas.map(area => {
                const typeConfig = getTypeConfig(area.typ);
                const isInRoute = routeAreaIds.includes(area.id);
                return (
                  <div key={area.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                    {/* Color accent strip */}
                    <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: typeConfig.color }} />

                    <div className="flex items-start gap-3 p-3.5 pl-4">
                      {/* Type icon */}
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                        style={{ background: `${typeConfig.color}22` }}
                      >
                        {typeConfig.emoji}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold">{area.nazev}</h3>
                          {isInRoute && (
                            <Badge className="shrink-0 bg-info/20 text-info border-info/30 text-[10px]">
                              v trase
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {area.okres && (
                            <span>{OKRES_NAMES[area.okres as OkresCode] || area.okres}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            {area.plocha_m2?.toLocaleString('cs-CZ') || '?'} m²
                          </span>
                          {area.obvod_oploceni_m ? (
                            <span className="flex items-center gap-1">
                              <Fence className="h-3 w-3" />
                              {area.obvod_oploceni_m} bm
                            </span>
                          ) : null}
                          {area.kategorie_travnate_plochy && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              kat. {area.kategorie_travnate_plochy}
                            </Badge>
                          )}
                        </div>
                        {area.stroje && (
                          <div className="mt-1 text-xs text-info">
                            🚜 {(area.stroje as any).vyrobni_cislo}
                          </div>
                        )}
                        {area.poznamky && (
                          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1 italic">{area.poznamky}</p>
                        )}
                      </div>

                      {/* Actions column */}
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {canDelete && (
                          <button
                            onClick={() => setAreaToDelete({ id: area.id, nazev: area.nazev })}
                            className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            aria-label={`Smazat ${area.nazev}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {area.gps_latitude && area.gps_longitude && (
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {area.gps_latitude.toFixed(4)}°N
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                <MapPin className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                {searchQuery ? 'Žádné výsledky' : 'Žádné areály'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? `Pro "${searchQuery}" nebyly nalezeny žádné areály`
                  : 'Přidejte první areál pro sledování prací'
                }
              </p>
              {!searchQuery && (
                <Button asChild className="mt-6 gap-2">
                  <Link to="/arealy/novy">
                    <Plus className="h-4 w-4" />
                    Přidat areál
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!areaToDelete} onOpenChange={(open) => !open && setAreaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat areál</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat areál <strong>{areaToDelete?.nazev}</strong>? Tuto akci nelze vrátit zpět.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => areaToDelete && deleteMutation.mutate(areaToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Mažu...' : 'Smazat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
