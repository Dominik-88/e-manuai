import { useEffect, useState } from 'react';

interface AreaPoint {
  id: string;
  nazev: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
}

const MATCH_RADIUS_M = 200;

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Watches user's geolocation and returns the nearest area within MATCH_RADIUS_M.
 * Returns null when geolocation is unavailable or no match.
 */
export function useNearestArea(areas: AreaPoint[] | undefined): {
  nearestId: string | null;
  nearestName: string | null;
  distanceM: number | null;
  enabled: boolean;
} {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setEnabled(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition(pos),
      (err) => {
        console.warn('[useNearestArea] geolocation error', err.message);
        setEnabled(false);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!position || !areas?.length) {
    return { nearestId: null, nearestName: null, distanceM: null, enabled };
  }

  let bestId: string | null = null;
  let bestName: string | null = null;
  let bestDist = Infinity;
  for (const a of areas) {
    if (a.gps_latitude == null || a.gps_longitude == null) continue;
    const d = haversineMeters(
      position.coords.latitude,
      position.coords.longitude,
      a.gps_latitude,
      a.gps_longitude
    );
    if (d < bestDist) {
      bestDist = d;
      bestId = a.id;
      bestName = a.nazev;
    }
  }

  if (bestDist > MATCH_RADIUS_M) {
    return { nearestId: null, nearestName: null, distanceM: null, enabled };
  }
  return { nearestId: bestId, nearestName: bestName, distanceM: bestDist, enabled };
}
