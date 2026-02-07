// Digital Twin: Hook for recording mowing sessions with GPS trajectory
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GeoPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

interface SessionState {
  isRecording: boolean;
  startTime: Date | null;
  points: GeoPoint[];
  watchId: number | null;
  sessionId: string | null;
}

export function useMowingSession(machineId: string, currentMth: number) {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionState>({
    isRecording: false,
    startTime: null,
    points: [],
    watchId: null,
    sessionId: null,
  });

  const pointsRef = useRef<GeoPoint[]>([]);

  const startSession = useCallback(async (arealId?: string, rezim = 'manuální', sMode?: number) => {
    if (!user) {
      toast.error('Pro záznam sečení musíte být přihlášeni');
      return;
    }

    // Insert session record
    const { data, error } = await supabase
      .from('seceni_relace')
      .insert({
        stroj_id: machineId,
        areal_id: arealId || null,
        user_id: user.id,
        mth_start: currentMth,
        rezim,
        s_mode: sMode || null,
      } as any)
      .select('id')
      .single();

    if (error) {
      toast.error('Nepodařilo se zahájit relaci');
      console.error(error);
      return;
    }

    // Start GPS tracking
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const point: GeoPoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: Date.now(),
          };
          pointsRef.current = [...pointsRef.current, point];
          setSession(prev => ({ ...prev, points: pointsRef.current }));
        },
        (err) => console.warn('GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }

    pointsRef.current = [];
    setSession({
      isRecording: true,
      startTime: new Date(),
      points: [],
      watchId,
      sessionId: data.id,
    });

    toast.success('Záznam sečení zahájen');
  }, [machineId, currentMth, user]);

  const stopSession = useCallback(async (endMth?: number, areaMowed?: number) => {
    if (!session.sessionId) return;

    // Stop GPS
    if (session.watchId !== null) {
      navigator.geolocation.clearWatch(session.watchId);
    }

    // Build GeoJSON from recorded points
    const points = pointsRef.current;
    const geojson = points.length >= 2 ? JSON.stringify({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: points.map(p => [p.lng, p.lat]),
      },
      properties: {
        pointCount: points.length,
        startTime: session.startTime?.toISOString(),
        endTime: new Date().toISOString(),
      },
    }) : null;

    // Calculate avg speed from points
    let avgSpeed: number | null = null;
    if (points.length >= 2) {
      const totalDistKm = points.reduce((sum, p, i) => {
        if (i === 0) return 0;
        return sum + haversineKm(points[i - 1].lat, points[i - 1].lng, p.lat, p.lng);
      }, 0);
      const totalHours = (points[points.length - 1].timestamp - points[0].timestamp) / 3600000;
      if (totalHours > 0) avgSpeed = parseFloat((totalDistKm / totalHours).toFixed(1));
    }

    const { error } = await supabase
      .from('seceni_relace')
      .update({
        datum_cas_konec: new Date().toISOString(),
        mth_konec: endMth || null,
        plocha_posekana_m2: areaMowed || null,
        prumerna_rychlost_kmh: avgSpeed,
        trajektorie_geojson: geojson,
      } as any)
      .eq('id', session.sessionId);

    if (error) {
      toast.error('Chyba při ukládání relace');
      console.error(error);
    } else {
      toast.success(`Relace uložena (${points.length} GPS bodů)`);
    }

    pointsRef.current = [];
    setSession({
      isRecording: false,
      startTime: null,
      points: [],
      watchId: null,
      sessionId: null,
    });
  }, [session]);

  return {
    isRecording: session.isRecording,
    startTime: session.startTime,
    pointCount: session.points.length,
    startSession,
    stopSession,
  };
}

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
