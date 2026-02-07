// OSRM routing library - real road routes, not straight lines

interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] pairs
  distanceKm: number;
  durationMin: number;
}

// In-memory cache for route results
const routeCache = new Map<string, RouteResult>();

function getCacheKey(coords: [number, number][]): string {
  return coords.map(c => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join('|');
}

// Decode Google-style encoded polyline (used by OSRM)
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// Fetch route from OSRM
export async function fetchRoute(
  waypoints: [number, number][] // [lat, lng] pairs
): Promise<RouteResult | null> {
  if (waypoints.length < 2) return null;

  const cacheKey = getCacheKey(waypoints);
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // OSRM expects lng,lat format
  const coordsStr = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=polyline`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM error: ${response.status}`);
    
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    const result: RouteResult = {
      coordinates: decodePolyline(route.geometry),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };

    routeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('OSRM routing failed, using fallback:', error);
    return null;
  }
}

// Fetch route between each consecutive pair of waypoints (for colored segments)
export async function fetchRouteSegments(
  waypoints: [number, number][]
): Promise<(RouteResult | null)[]> {
  if (waypoints.length < 2) return [];
  
  const promises: Promise<RouteResult | null>[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    promises.push(fetchRoute([waypoints[i], waypoints[i + 1]]));
  }
  return Promise.all(promises);
}

// Haversine distance fallback
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nearest-neighbor TSP optimization
export function optimizeRouteOrder<T extends { gps_latitude: number | null; gps_longitude: number | null; id: string }>(
  areas: T[]
): T[] {
  const withGps = areas.filter(a => a.gps_latitude && a.gps_longitude);
  const withoutGps = areas.filter(a => !a.gps_latitude || !a.gps_longitude);

  if (withGps.length <= 2) return areas;

  const visited = new Set<string>();
  const result: T[] = [];
  let current = withGps[0];
  result.push(current);
  visited.add(current.id);

  while (visited.size < withGps.length) {
    let nearest: T | null = null;
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

// Generate Google Maps navigation URL with all waypoints
export function buildGoogleMapsUrl(waypoints: [number, number][]): string | null {
  if (waypoints.length < 2) return null;
  const origin = `${waypoints[0][0]},${waypoints[0][1]}`;
  const dest = `${waypoints[waypoints.length - 1][0]},${waypoints[waypoints.length - 1][1]}`;
  const middle = waypoints.slice(1, -1).map(w => `${w[0]},${w[1]}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${middle ? `&waypoints=${middle}` : ''}&travelmode=driving`;
}
