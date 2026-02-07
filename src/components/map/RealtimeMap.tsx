/**
 * Realtime Map Component
 * 
 * Live tracking robotické sekačky s:
 * - Real-time pozice z Supabase Realtime
 * - Trail (cesta stroje) za poslední hodinu
 * - Barevné indikátory RTK statusu
 * - Popup s detaily telemetrie
 */

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Satellite, Navigation, Battery, Thermometer, Gauge } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TelemetryPoint {
  gps_lat: number;
  gps_lng: number;
  gps_alt: number;
  rtk_status: 'FIX' | 'FLOAT' | 'NONE';
  rtk_accuracy_cm: number;
  speed_kmh: number;
  heading_deg: number;
  battery_percentage: number;
  battery_voltage: number;
  engine_temp_c: number;
  oil_pressure_bar: number;
  blade_rpm: number;
  mth: number;
  timestamp: string;
}

interface RealtimeMapProps {
  strojId: string;
  height?: string;
  showTrail?: boolean;
  trailHours?: number;
  autoCenter?: boolean;
}

// Komponenta pro auto-center mapy
function MapAutoCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export function RealtimeMap({ 
  strojId, 
  height = '600px',
  showTrail = true,
  trailHours = 1,
  autoCenter = false
}: RealtimeMapProps) {
  const [currentPosition, setCurrentPosition] = useState<TelemetryPoint | null>(null);
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // 1. Načti poslední pozici a trail
    loadInitialData();

    // 2. Subscribe na realtime updates
    subscribeToTelemetry();

    return () => {
      // Cleanup subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [strojId, trailHours]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Načti poslední pozici
      const { data: latest, error: latestError } = await supabase
        .rpc('get_latest_telemetry', { p_stroj_id: strojId });

      if (latestError) throw latestError;

      if (latest && latest.length > 0) {
        setCurrentPosition(latest[0]);
      }

      // Načti trail pokud je zapnutý
      if (showTrail) {
        const { data: trailData, error: trailError } = await supabase
          .rpc('get_telemetry_trail', { 
            p_stroj_id: strojId,
            p_hours: trailHours,
            p_limit: 100
          });

        if (trailError) throw trailError;

        if (trailData) {
          const trailPoints: [number, number][] = trailData.map(
            (point: any) => [point.gps_lat, point.gps_lng]
          );
          setTrail(trailPoints);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('❌ Error loading map data:', err);
      setError(err instanceof Error ? err.message : 'Chyba načítání dat');
      setIsLoading(false);
    }
  };

  const subscribeToTelemetry = () => {
    const channel = supabase
      .channel(`telemetry-${strojId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetrie_log',
          filter: `stroj_id=eq.${strojId}`
        },
        (payload) => {
          console.log('📡 Nová telemetrie:', payload.new);
          const newPoint = payload.new as TelemetryPoint;
          
          setCurrentPosition(newPoint);
          
          // Přidej do trail (max 100 bodů)
          if (showTrail) {
            setTrail(prev => {
              const updated = [...prev, [newPoint.gps_lat, newPoint.gps_lng] as [number, number]];
              return updated.slice(-100);
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const getMarkerColor = (rtk: string): string => {
    switch (rtk) {
      case 'FIX': return '#22c55e'; // zelená - přesnost 1-3cm
      case 'FLOAT': return '#f97316'; // oranžová - přesnost ~1m
      case 'NONE': return '#ef4444'; // červená - bez korekce
      default: return '#6b7280'; // šedá - neznámý stav
    }
  };

  const getRtkBadgeVariant = (rtk: string): 'default' | 'secondary' | 'destructive' => {
    switch (rtk) {
      case 'FIX': return 'default';
      case 'FLOAT': return 'secondary';
      default: return 'destructive';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Načítání mapy...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold text-destructive">Chyba načítání mapy</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!currentPosition) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Satellite className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Žádná telemetrie</h3>
            <p className="text-sm text-muted-foreground">
              Čekám na první GPS signál ze stroje...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const center: [number, number] = [currentPosition.gps_lat, currentPosition.gps_lng];

  return (
    <div className="space-y-4">
      {/* Mapa */}
      <div className="relative overflow-hidden rounded-xl border border-border">
        <MapContainer
          center={center}
          zoom={18}
          style={{ height, width: '100%' }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Auto-center pokud je zapnutý */}
          {autoCenter && <MapAutoCenter center={center} zoom={18} />}

          {/* Trail - cesta stroje */}
          {showTrail && trail.length > 1 && (
            <Polyline
              positions={trail}
              pathOptions={{
                color: '#3b82f6',
                weight: 3,
                opacity: 0.6,
                dashArray: '5, 10'
              }}
            />
          )}

          {/* Aktuální pozice */}
          <CircleMarker
            center={center}
            radius={14}
            pathOptions={{
              color: getMarkerColor(currentPosition.rtk_status),
              fillColor: getMarkerColor(currentPosition.rtk_status),
              fillOpacity: 0.8,
              weight: 3
            }}
          >
            <Popup className="custom-popup">
              <div className="min-w-[250px] space-y-3 p-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Live Telemetrie</h3>
                  <Badge variant={getRtkBadgeVariant(currentPosition.rtk_status)}>
                    {currentPosition.rtk_status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {/* RTK */}
                  <div className="flex items-center gap-2">
                    <Satellite className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Přesnost:</span>
                    <span className="font-mono font-semibold">
                      {currentPosition.rtk_accuracy_cm} cm
                    </span>
                  </div>

                  {/* Rychlost */}
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Rychlost:</span>
                    <span className="font-mono font-semibold">
                      {currentPosition.speed_kmh.toFixed(1)} km/h
                    </span>
                  </div>

                  {/* Baterie */}
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Baterie:</span>
                    <span className="font-mono font-semibold">
                      {currentPosition.battery_percentage}%
                    </span>
                  </div>

                  {/* Teplota */}
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Teplota:</span>
                    <span className="font-mono font-semibold">
                      {currentPosition.engine_temp_c.toFixed(1)}°C
                    </span>
                  </div>

                  {/* MTH */}
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">MTH:</span>
                    <span className="font-mono font-semibold">
                      {currentPosition.mth.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-2 text-xs text-muted-foreground">
                  {new Date(currentPosition.timestamp).toLocaleString('cs-CZ')}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        </MapContainer>

        {/* Live indicator */}
        <div className="absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-lg bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
          <span className="text-xs font-medium">LIVE</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-[#22c55e]" />
          <span className="text-sm">RTK FIX (1-3cm)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-[#f97316]" />
          <span className="text-sm">RTK FLOAT (~1m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-[#ef4444]" />
          <span className="text-sm">Bez RTK korekce</span>
        </div>
        {showTrail && (
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-[#3b82f6]" style={{ borderTop: '3px dashed #3b82f6' }} />
            <span className="text-sm">Trasa ({trailHours}h)</span>
          </div>
        )}
      </div>
    </div>
  );
}
