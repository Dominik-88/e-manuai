import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, X, Navigation, ChevronUp, ChevronDown, Route, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nearest-neighbor TSP approximation
function optimizeRoute(areas: RouteArea[]): RouteArea[] {
  if (areas.length <= 2) return areas;

  const withGps = areas.filter(a => a.gps_latitude && a.gps_longitude);
  const withoutGps = areas.filter(a => !a.gps_latitude || !a.gps_longitude);

  if (withGps.length <= 1) return areas;

  const visited = new Set<string>();
  const result: RouteArea[] = [];
  let current = withGps[0];
  result.push(current);
  visited.add(current.id);

  while (visited.size < withGps.length) {
    let nearest: RouteArea | null = null;
    let minDist = Infinity;
    for (const a of withGps) {
      if (visited.has(a.id)) continue;
      const d = haversineKm(current.gps_latitude!, current.gps_longitude!, a.gps_latitude!, a.gps_longitude!);
      if (d < minDist) {
        minDist = d;
        nearest = a;
      }
    }
    if (nearest) {
      result.push(nearest);
      visited.add(nearest.id);
      current = nearest;
    }
  }

  return [...result, ...withoutGps];
}

export function RoutePlanner({ areas }: RoutePlannerProps) {
  const [routeAreas, setRouteAreas] = useState<RouteArea[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const totalArea = useMemo(() =>
    routeAreas.reduce((sum, a) => sum + (a.plocha_m2 || 0), 0),
    [routeAreas]
  );

  const totalDistanceKm = useMemo(() => {
    let dist = 0;
    for (let i = 1; i < routeAreas.length; i++) {
      const prev = routeAreas[i - 1];
      const curr = routeAreas[i];
      if (prev.gps_latitude && prev.gps_longitude && curr.gps_latitude && curr.gps_longitude) {
        dist += haversineKm(prev.gps_latitude, prev.gps_longitude, curr.gps_latitude, curr.gps_longitude);
      }
    }
    return dist;
  }, [routeAreas]);

  const availableAreas = useMemo(() =>
    areas.filter(a => !routeAreas.find(r => r.id === a.id)),
    [areas, routeAreas]
  );

  const addToRoute = useCallback((area: RouteArea) => {
    setRouteAreas(prev => [...prev, area]);
    toast.success(`${area.nazev} přidán do trasy`);
    if ('vibrate' in navigator) navigator.vibrate(30);
  }, []);

  const removeFromRoute = useCallback((id: string) => {
    setRouteAreas(prev => prev.filter(a => a.id !== id));
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setRouteAreas(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setRouteAreas(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleOptimize = useCallback(() => {
    const optimized = optimizeRoute(routeAreas);
    setRouteAreas(optimized);
    toast.success('Trasa optimalizována');
  }, [routeAreas]);

  const openGoogleMapsRoute = useCallback(() => {
    const waypoints = routeAreas
      .filter(a => a.gps_latitude && a.gps_longitude)
      .map(a => `${a.gps_latitude},${a.gps_longitude}`);
    if (waypoints.length < 2) {
      toast.error('Potřebujete alespoň 2 body s GPS');
      return;
    }
    const origin = waypoints[0];
    const dest = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(1, -1).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${middle ? `&waypoints=${middle}` : ''}&travelmode=driving`;
    window.open(url, '_blank');
  }, [routeAreas]);

  return (
    <div className="dashboard-widget !border-l-info">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-info" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Dnešní trasa
          </h3>
          {routeAreas.length > 0 && (
            <span className="rounded-full bg-info/20 px-2 py-0.5 text-xs font-bold text-info">
              {routeAreas.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Route summary */}
          {routeAreas.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-2">
                <span className="font-mono text-lg font-bold text-info">{routeAreas.length}</span>
                <p className="text-[10px] text-muted-foreground">areálů</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <span className="font-mono text-lg font-bold text-success">{(totalArea / 10000).toFixed(2)}</span>
                <p className="text-[10px] text-muted-foreground">ha</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <span className="font-mono text-lg font-bold text-warning">{totalDistanceKm.toFixed(1)}</span>
                <p className="text-[10px] text-muted-foreground">km přejezd</p>
              </div>
            </div>
          )}

          {/* Route items */}
          {routeAreas.map((area, index) => (
            <div key={area.id} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-info/20 text-xs font-bold text-info">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{area.nazev}</p>
                <p className="text-[10px] text-muted-foreground">
                  {area.plocha_m2?.toLocaleString('cs-CZ') || '?'} m²
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveUp(index)} className="rounded p-1.5 hover:bg-muted" aria-label="Posunout nahoru">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => moveDown(index)} className="rounded p-1.5 hover:bg-muted" aria-label="Posunout dolů">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => removeFromRoute(area.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Odebrat">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Available areas to add */}
          {availableAreas.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Přidat areál do trasy:</p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {availableAreas.slice(0, 10).map(area => (
                  <button
                    key={area.id}
                    onClick={() => addToRoute(area)}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                  >
                    <Plus className="h-4 w-4 text-info" />
                    <span className="flex-1 truncate text-sm">{area.nazev}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {area.plocha_m2?.toLocaleString('cs-CZ') || '?'} m²
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {routeAreas.length >= 2 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOptimize}
                className="h-10 flex-1 gap-1.5 text-xs"
              >
                <Route className="h-3.5 w-3.5" />
                Optimalizovat
              </Button>
              <Button
                size="sm"
                onClick={openGoogleMapsRoute}
                className="h-10 flex-1 gap-1.5 text-xs"
              >
                <Navigation className="h-3.5 w-3.5" />
                Navigovat
              </Button>
            </div>
          )}

          {routeAreas.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Přidejte areály do dnešní trasy pro výpočet přejezdů
            </p>
          )}
        </div>
      )}
    </div>
  );
}
