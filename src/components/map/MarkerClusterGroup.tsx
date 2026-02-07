import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MarkerData {
  position: [number, number];
  icon: L.DivIcon;
  popupContent?: string;
  popupElement?: HTMLElement;
  id: string;
}

interface MarkerClusterGroupProps {
  markers: MarkerData[];
  onMarkerClick?: (id: string) => void;
  maxClusterRadius?: number;
}

// Simple grid-based clustering
function clusterMarkers(
  markers: MarkerData[],
  map: L.Map,
  radius: number
): { center: [number, number]; markers: MarkerData[] }[] {
  const zoom = map.getZoom();
  const clusters: { center: [number, number]; markers: MarkerData[] }[] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < markers.length; i++) {
    if (assigned.has(i)) continue;
    const group: MarkerData[] = [markers[i]];
    assigned.add(i);

    const point = map.latLngToContainerPoint(markers[i].position);

    for (let j = i + 1; j < markers.length; j++) {
      if (assigned.has(j)) continue;
      const otherPoint = map.latLngToContainerPoint(markers[j].position);
      const dist = Math.sqrt(
        Math.pow(point.x - otherPoint.x, 2) + Math.pow(point.y - otherPoint.y, 2)
      );
      if (dist < radius) {
        group.push(markers[j]);
        assigned.add(j);
      }
    }

    const avgLat = group.reduce((s, m) => s + m.position[0], 0) / group.length;
    const avgLng = group.reduce((s, m) => s + m.position[1], 0) / group.length;
    clusters.push({ center: [avgLat, avgLng], markers: group });
  }

  return clusters;
}

function createClusterIcon(count: number): L.DivIcon {
  const size = count < 10 ? 30 : count < 100 ? 36 : 40;
  const color = count < 5 ? 'hsl(var(--primary))' : count < 15 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: ${size < 36 ? 11 : 13}px;
      font-family: 'Roboto Mono', monospace;
      box-shadow: 0 0 6px ${color}, 0 1px 4px rgba(0,0,0,0.3);
      border: 2px solid rgba(255,255,255,0.3);
      cursor: pointer;
      transition: transform 0.15s;
    ">${count}</div>`,
    className: 'custom-cluster-marker',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}

export function MarkerClusterGroup({ markers, onMarkerClick, maxClusterRadius = 60 }: MarkerClusterGroupProps) {
  const map = useMap();

  useEffect(() => {
    const layerGroup = L.layerGroup().addTo(map);

    const updateClusters = () => {
      layerGroup.clearLayers();

      const clusters = clusterMarkers(markers, map, maxClusterRadius);

      for (const cluster of clusters) {
        if (cluster.markers.length === 1) {
          const m = cluster.markers[0];
          const marker = L.marker(m.position, { icon: m.icon });
          if (m.popupContent) {
            marker.bindPopup(m.popupContent, { minWidth: 260, maxWidth: 320, className: 'area-popup' });
          }
          if (onMarkerClick) {
            marker.on('click', () => onMarkerClick(m.id));
          }
          layerGroup.addLayer(marker);
        } else {
          const icon = createClusterIcon(cluster.markers.length);
          const marker = L.marker(cluster.center, { icon });
          marker.on('click', () => {
            const bounds = L.latLngBounds(cluster.markers.map(m => m.position));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
          });
          layerGroup.addLayer(marker);
        }
      }
    };

    updateClusters();

    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateClusters, 150);
    };

    map.on('zoomend moveend', debouncedUpdate);

    return () => {
      clearTimeout(debounceTimer);
      map.off('zoomend moveend', debouncedUpdate);
      layerGroup.remove();
    };
  }, [map, markers, maxClusterRadius, onMarkerClick]);

  return null;
}
