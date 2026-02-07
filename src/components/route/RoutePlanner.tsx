import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapPin, Plus, X, Navigation, ChevronUp, ChevronDown, Route, Trash2, Zap, Clock, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { optimizeRouteOrder, haversineKm, buildGoogleMapsUrl, fetchRoute } from '@/lib/routing';
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

interface RouteArea {
  id: string;
  nazev: string;
  plocha_m2: number | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  google_maps_link: string | null;
  typ: string;
  okres: string | null;
}

interface RoutePlannerProps {
  areas: RouteArea[];
  routeAreas: RouteArea[];
  setRouteAreas: React.Dispatch<React.SetStateAction<RouteArea[]>>;
}

export function RoutePlanner({ areas, routeAreas, setRouteAreas }: RoutePlannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const totalArea = useMemo(() =>
    routeAreas.reduce((sum, a) => sum + (a.plocha_m2 || 0), 0),
    [routeAreas]
  );

  // Fetch real road distance when route changes
  useEffect(() => {
    const waypoints = routeAreas
      .filter(a => a.gps_latitude && a.gps_longitude)
      .map(a => [a.gps_latitude!, a.gps_longitude!] as [number, number]);

    if (waypoints.length < 2) {
      setRouteDistance(null);
      setRouteDuration(null);
      return;
    }

    let cancelled = false;
    setLoadingRoute(true);

    fetchRoute(waypoints).then(result => {
      if (cancelled) return;
      if (result) {
        setRouteDistance(result.distanceKm);
        setRouteDuration(result.durationMin);
      } else {
        // Fallback to haversine
        let dist = 0;
        for (let i = 1; i < waypoints.length; i++) {
          dist += haversineKm(waypoints[i - 1][0], waypoints[i - 1][1], waypoints[i][0], waypoints[i][1]);
        }
        setRouteDistance(dist);
        setRouteDuration(null);
      }
      setLoadingRoute(false);
    });

    return () => { cancelled = true; };
  }, [routeAreas]);

  const availableAreas = useMemo(() =>
    areas.filter(a => !routeAreas.find(r => r.id === a.id)),
    [areas, routeAreas]
  );

  const addToRoute = useCallback((area: RouteArea) => {
    setRouteAreas(prev => [...prev, area]);
    toast.success(`${area.nazev} přidán do trasy`);
    if ('vibrate' in navigator) navigator.vibrate(30);
  }, [setRouteAreas]);

  const removeFromRoute = useCallback((id: string) => {
    setRouteAreas(prev => prev.filter(a => a.id !== id));
  }, [setRouteAreas]);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setRouteAreas(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, [setRouteAreas]);

  const moveDown = useCallback((index: number) => {
    setRouteAreas(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, [setRouteAreas]);

  const handleOptimize = useCallback(() => {
    const optimized = optimizeRouteOrder(routeAreas);
    setRouteAreas(optimized);
    toast.success('Trasa optimalizována');
  }, [routeAreas, setRouteAreas]);

  const handleClearAll = useCallback(() => {
    setRouteAreas([]);
    setShowClearDialog(false);
    toast.success('Trasa vymazána');
  }, [setRouteAreas]);

  const handleAddAllGps = useCallback(() => {
    const gpsAreas = areas.filter(a => a.gps_latitude && a.gps_longitude && !routeAreas.find(r => r.id === a.id));
    setRouteAreas(prev => [...prev, ...gpsAreas]);
    toast.success(`Přidáno ${gpsAreas.length} areálů`);
  }, [areas, routeAreas, setRouteAreas]);

  const openGoogleMapsRoute = useCallback(() => {
    const waypoints = routeAreas
      .filter(a => a.gps_latitude && a.gps_longitude)
      .map(a => [a.gps_latitude!, a.gps_longitude!] as [number, number]);
    const url = buildGoogleMapsUrl(waypoints);
    if (!url) {
      toast.error('Potřebujete alespoň 2 body s GPS');
      return;
    }
    window.open(url, '_blank');
  }, [routeAreas]);

  const areasWithGps = areas.filter(a => a.gps_latitude && a.gps_longitude);

  return (
    <>
      <div className="dashboard-widget !border-l-info">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-info" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Plánovač tras
            </h3>
            {routeAreas.length > 0 && (
              <span className="rounded-full bg-info/20 px-2.5 py-0.5 text-xs font-bold text-info">
                {routeAreas.length}
              </span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="mt-4 space-y-3">
            {/* Route statistics */}
            {routeAreas.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <span className="font-mono text-lg font-bold text-info">{routeAreas.length}</span>
                  <p className="text-[10px] text-muted-foreground">zastávek</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <span className="font-mono text-lg font-bold text-success">{(totalArea / 10000).toFixed(1)}</span>
                  <p className="text-[10px] text-muted-foreground">ha</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  {loadingRoute ? (
                    <div className="flex items-center justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-warning border-t-transparent" />
                    </div>
                  ) : (
                    <span className="font-mono text-lg font-bold text-warning">
                      {routeDistance ? routeDistance.toFixed(1) : '—'}
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground">km</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <span className="font-mono text-lg font-bold text-primary">
                    {routeDuration ? `${Math.round(routeDuration)}` : '—'}
                  </span>
                  <p className="text-[10px] text-muted-foreground">min</p>
                </div>
              </div>
            )}

            {/* Route items */}
            <div className="space-y-1.5">
              {routeAreas.map((area, index) => (
                <div key={area.id} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2.5 transition-colors hover:bg-muted/50">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    index === 0 ? 'bg-success' : index === routeAreas.length - 1 ? 'bg-destructive' : 'bg-primary'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{area.nazev}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {area.plocha_m2?.toLocaleString('cs-CZ') || '?'} m²
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => moveUp(index)} className="rounded p-1.5 hover:bg-muted" disabled={index === 0}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveDown(index)} className="rounded p-1.5 hover:bg-muted" disabled={index === routeAreas.length - 1}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => removeFromRoute(area.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add buttons */}
            <div className="flex flex-wrap gap-1.5">
              {areasWithGps.length > routeAreas.length && (
                <Button variant="outline" size="sm" onClick={handleAddAllGps} className="h-9 gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Přidat vše s GPS ({areasWithGps.length - routeAreas.filter(a => a.gps_latitude).length})
                </Button>
              )}
            </div>

            {/* Available areas */}
            {availableAreas.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Přidat do trasy:</p>
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border/50 p-1">
                  {availableAreas.map(area => (
                    <button
                      key={area.id}
                      onClick={() => addToRoute(area)}
                      className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-muted active:scale-[0.98]"
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0 text-info" />
                      <span className="flex-1 truncate text-sm">{area.nazev}</span>
                      {area.gps_latitude && <MapPin className="h-3 w-3 shrink-0 text-success" />}
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {area.plocha_m2?.toLocaleString('cs-CZ') || '?'} m²
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions bar */}
            {routeAreas.length >= 2 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleOptimize} className="h-10 flex-1 gap-1.5 text-xs">
                  <Zap className="h-3.5 w-3.5" />
                  Optimalizovat
                </Button>
                <Button size="sm" onClick={openGoogleMapsRoute} className="h-10 flex-1 gap-1.5 text-xs">
                  <Navigation className="h-3.5 w-3.5" />
                  Navigovat
                </Button>
              </div>
            )}

            {/* Clear all button */}
            {routeAreas.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="h-9 w-full gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Zrušit celou trasu
              </Button>
            )}

            {routeAreas.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Přidejte areály do trasy kliknutím na tlačítko + nebo přímo na mapě
              </p>
            )}
          </div>
        )}
      </div>

      {/* Clear confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zrušit celou trasu?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat všech {routeAreas.length} zastávek z trasy? Tuto akci nelze vrátit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ne, zachovat</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ano, vymazat vše
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
