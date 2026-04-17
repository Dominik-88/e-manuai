import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Search, MapPin, FileSpreadsheet, FileText, X, Map, List, Filter, Trash2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OKRES_NAMES } from '@/types/database';
import type { OkresCode } from '@/types/database';
import { exportAreasToExcel, exportAreasReportPDF } from '@/lib/export';
import { saveQuickMow } from '@/lib/offline-queue';
import { toast } from 'sonner';
import { AreasMap } from '@/components/map/AreasMap';
import { RoutePlanner } from '@/components/route/RoutePlanner';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { useAreaStatuses, getStatusForArea } from '@/hooks/useAreaStatuses';
import { useNearestArea } from '@/hooks/useNearestArea';
import { AreaCard, type AreaCardArea } from '@/components/areas/AreaCard';
import { AreaProgressBar } from '@/components/areas/AreaProgressBar';
import { QuickMowDialog } from '@/components/areas/QuickMowDialog';
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

type StatusFilter = 'all' | 'todo-today' | 'high-priority' | 'done-today';

export default function AreasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterTyp, setFilterTyp] = useState<string>('all');
  const [filterOkres, setFilterOkres] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [areaToDelete, setAreaToDelete] = useState<{ id: string; nazev: string } | null>(null);
  const [areaToMow, setAreaToMow] = useState<AreaCardArea | null>(null);
  const [routeAreas, setRouteAreas] = useState<any[]>([]);
  const [savingMow, setSavingMow] = useState(false);

  const { isAdmin, isTechnik, user } = useAuth();
  const { machine } = useMachine();
  const queryClient = useQueryClient();
  const canDelete = isAdmin || isTechnik;

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arealy')
        .select(`*, stroje (vyrobni_cislo, model)`)
        .order('nazev');
      if (error) throw error;
      return data;
    },
  });

  const { data: statuses } = useAreaStatuses();

  const nearest = useNearestArea(areas as any);

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

  // Undo last today's mowing for an area
  const undoMowMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('seceni_relace').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-statuses'] });
      toast.success('Stav vrácen zpět');
    },
    onError: (e: any) => toast.error('Nelze vrátit zpět: ' + e.message),
  });

  const filteredAreas = useMemo(() => {
    if (!areas) return [];
    return areas.filter((area) => {
      const matchesSearch = !searchQuery ||
        area.nazev.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.okres?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTyp = filterTyp === 'all' || area.typ === filterTyp;
      const matchesOkres = filterOkres === 'all' || area.okres === filterOkres;

      const status = getStatusForArea(statuses, area.id);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'todo-today' && !status.isMowedToday) ||
        (statusFilter === 'done-today' && status.isMowedToday) ||
        (statusFilter === 'high-priority' &&
          (status.priority === 'high' || status.priority === 'never'));

      return matchesSearch && matchesTyp && matchesOkres && matchesStatus;
    });
  }, [areas, searchQuery, filterTyp, filterOkres, statusFilter, statuses]);

  // Progress aggregation across full (unfiltered) area set
  const progress = useMemo(() => {
    if (!areas) return { total: 0, done: 0, totalArea: 0, doneArea: 0, high: 0 };
    let done = 0, doneArea = 0, totalArea = 0, high = 0;
    for (const a of areas) {
      const s = getStatusForArea(statuses, a.id);
      const area = a.plocha_m2 || 0;
      totalArea += area;
      if (s.isMowedToday) { done++; doneArea += area; }
      if ((s.priority === 'high' || s.priority === 'never') && !s.isMowedToday) high++;
    }
    return { total: areas.length, done, totalArea, doneArea, high };
  }, [areas, statuses]);

  const uniqueTypes = useMemo(() => {
    if (!areas) return [];
    return [...new Set(areas.map((a) => a.typ).filter(Boolean))].sort();
  }, [areas]);

  const uniqueOkresy = useMemo(() => {
    if (!areas) return [];
    return [...new Set(areas.map((a) => a.okres).filter(Boolean))].sort() as string[];
  }, [areas]);

  const handleExportExcel = async () => {
    if (!areas?.length) { toast.error('Žádné areály k exportu'); return; }
    try {
      await exportAreasToExcel(areas);
      toast.success('Excel byl úspěšně stažen');
    } catch { toast.error('Chyba při exportu'); }
  };

  const handleExportPDF = async () => {
    if (!areas?.length) { toast.error('Žádné areály k exportu'); return; }
    try {
      const rows = areas.map((a) => {
        const s = getStatusForArea(statuses, a.id);
        return {
          nazev: a.nazev,
          typ: a.typ,
          plocha_m2: a.plocha_m2,
          okres: a.okres,
          status: s.priority === 'done-today' ? 'done-today' as const : s.priority,
          daysSince: s.daysSince,
          lastMowedAt: s.lastMowedAt,
          poznamky: a.poznamky,
        };
      });
      await exportAreasReportPDF(rows);
      toast.success('PDF protokol stažen');
    } catch (e: any) {
      toast.error('Chyba při PDF exportu: ' + e.message);
    }
  };

  const handleToggleRoute = useCallback((area: any) => {
    setRouteAreas((prev) => {
      const exists = prev.find((a: any) => a.id === area.id);
      if (exists) return prev.filter((a: any) => a.id !== area.id);
      return [...prev, area];
    });
  }, []);

  const routeAreaIds = useMemo(() => routeAreas.map((a: any) => a.id), [routeAreas]);

  const handleConfirmMow = async (note: string | null) => {
    if (!areaToMow || !machine || !user) {
      toast.error('Chybí stroj nebo uživatel');
      return;
    }
    setSavingMow(true);
    try {
      const result = await saveQuickMow({
        arealId: areaToMow.id,
        stroj_id: machine.id,
        user_id: user.id,
        mth_start: machine.aktualni_mth,
        plocha_m2: areaToMow.plocha_m2,
        poznamky: note,
      });

      // Haptic feedback
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(50);
      }

      // Optimistic refresh
      queryClient.invalidateQueries({ queryKey: ['area-statuses'] });

      const closed = areaToMow;
      setAreaToMow(null);

      toast.success(
        result.offline ? '📵 Uloženo offline – synchronizace později' : `✓ ${closed.nazev} – posekáno`,
        {
          duration: 5000,
          action: {
            label: 'Vrátit zpět',
            onClick: async () => {
              // Re-fetch latest status to get session id
              const { data } = await supabase
                .from('seceni_relace')
                .select('id')
                .eq('areal_id', closed.id)
                .order('datum_cas_start', { ascending: false })
                .limit(1)
                .maybeSingle();
              if (data?.id) undoMowMutation.mutate(data.id);
            },
          },
        }
      );
    } catch (e: any) {
      toast.error('Nelze uložit: ' + e.message);
    } finally {
      setSavingMow(false);
    }
  };

  const handleUndoFromCard = async (arealId: string) => {
    const status = getStatusForArea(statuses, arealId);
    if (!status.lastSessionId || !status.isMowedToday) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(30);
    undoMowMutation.mutate(status.lastSessionId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Areály</h1>
            <p className="text-xs text-muted-foreground">
              {progress.total} objektů · {(progress.totalArea / 1000).toFixed(1)} k m²
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" onClick={handleExportPDF} size="icon" className="h-10 w-10" aria-label="PDF protokol">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExportExcel} size="icon" className="h-10 w-10" aria-label="Excel">
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
          <Button asChild size="icon" className="h-10 w-10">
            <Link to="/arealy/novy" aria-label="Nový areál">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Daily progress dashboard */}
      <AreaProgressBar
        totalCount={progress.total}
        doneTodayCount={progress.done}
        totalAreaM2={progress.totalArea}
        doneAreaM2={progress.doneArea}
        highPriorityCount={progress.high}
      />

      {/* Geofence auto-suggest banner */}
      {nearest.nearestId && nearest.nearestName && (() => {
        const s = getStatusForArea(statuses, nearest.nearestId);
        if (s.isMowedToday) return null;
        return (
          <button
            onClick={() => {
              const a = areas?.find((x) => x.id === nearest.nearestId);
              if (a) setAreaToMow(a as AreaCardArea);
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-info/40 bg-info/10 p-3 text-left transition-all hover:bg-info/15 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/20">
              <Sparkles className="h-5 w-5 text-info" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wide text-info">Jste poblíž areálu</div>
              <div className="truncate font-semibold">{nearest.nearestName}</div>
              <div className="text-[11px] text-muted-foreground">
                {Math.round(nearest.distanceM ?? 0)} m · ťukněte pro označení
              </div>
            </div>
          </button>
        );
      })()}

      {/* Search + Filters */}
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
          <SelectTrigger className="h-11 w-[110px] text-xs">
            <Filter className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            {uniqueTypes.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterOkres} onValueChange={setFilterOkres}>
          <SelectTrigger className="hidden h-11 w-[120px] text-xs sm:flex">
            <SelectValue placeholder="Okres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny okresy</SelectItem>
            {uniqueOkresy.map((o) => (
              <SelectItem key={o} value={o}>{OKRES_NAMES[o as OkresCode] || o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ['all', 'Vše', progress.total],
          ['todo-today', 'Neposekané', progress.total - progress.done],
          ['high-priority', 'Přerůstá', progress.high],
          ['done-today', 'Hotovo dnes', progress.done],
        ] as Array<[StatusFilter, string, number]>).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              statusFilter === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            <span>{label}</span>
            <span className="font-mono text-[10px] opacity-70">{count}</span>
          </button>
        ))}
        {(filterTyp !== 'all' || filterOkres !== 'all') && (
          <button
            onClick={() => { setFilterTyp('all'); setFilterOkres('all'); }}
            className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-1.5 text-xs text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Route planner */}
      {filteredAreas && filteredAreas.length > 0 && (
        <RoutePlanner areas={filteredAreas} routeAreas={routeAreas} setRouteAreas={setRouteAreas} />
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

      {/* Grid view (cards) */}
      {viewMode === 'list' && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : filteredAreas && filteredAreas.length > 0 ? (
            <div className="space-y-2.5">
              {filteredAreas.map((area) => {
                const status = getStatusForArea(statuses, area.id);
                const isInRoute = routeAreaIds.includes(area.id);
                const isNearest = nearest.nearestId === area.id;
                return (
                  <AreaCard
                    key={area.id}
                    area={area as AreaCardArea}
                    status={status}
                    isNearest={isNearest}
                    isInRoute={isInRoute}
                    canDelete={canDelete}
                    onToggleMowed={() => setAreaToMow(area as AreaCardArea)}
                    onUndoMowed={() => handleUndoFromCard(area.id)}
                    onDelete={canDelete ? () => setAreaToDelete({ id: area.id, nazev: area.nazev }) : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                <MapPin className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                {searchQuery || statusFilter !== 'all' ? 'Žádné výsledky' : 'Žádné areály'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? `Pro "${searchQuery}" nebyly nalezeny žádné areály`
                  : statusFilter !== 'all'
                    ? 'Zkuste změnit filtr'
                    : 'Přidejte první areál pro sledování prací'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
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

      {/* Quick mow dialog */}
      {areaToMow && (
        <QuickMowDialog
          open={!!areaToMow}
          onOpenChange={(o) => !o && setAreaToMow(null)}
          arealNazev={areaToMow.nazev}
          arealPlochaM2={areaToMow.plocha_m2}
          onConfirm={handleConfirmMow}
          saving={savingMow}
        />
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
