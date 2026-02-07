import React, { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';
import { fetchRoute } from '@/lib/routing';

// Segment colors cycling through a palette
const SEGMENT_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

interface RoutePolylineProps {
  waypoints: [number, number][]; // [lat, lng]
}

export function RoutePolyline({ waypoints }: RoutePolylineProps) {
  const [segments, setSegments] = useState<[number, number][][]>([]);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (waypoints.length < 2) {
      setSegments([]);
      return;
    }

    let cancelled = false;

    async function loadSegments() {
      const newSegments: [number, number][][] = [];
      let anyFailed = false;

      // Fetch each segment in parallel
      const promises = [];
      for (let i = 0; i < waypoints.length - 1; i++) {
        promises.push(fetchRoute([waypoints[i], waypoints[i + 1]]));
      }

      const results = await Promise.all(promises);
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result) {
          newSegments.push(result.coordinates);
        } else {
          // Fallback: straight line
          anyFailed = true;
          newSegments.push([waypoints[i], waypoints[i + 1]]);
        }
      }

      if (!cancelled) {
        setSegments(newSegments);
        setFallback(anyFailed);
      }
    }

    loadSegments();
    return () => { cancelled = true; };
  }, [waypoints]);

  if (segments.length === 0) return null;

  return (
    <>
      {segments.map((coords, i) => (
        <Polyline
          key={`segment-${i}-${coords.length}`}
          positions={coords}
          pathOptions={{
            color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
            weight: 4,
            opacity: 0.85,
            dashArray: fallback ? '8, 8' : undefined,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}
    </>
  );
}
