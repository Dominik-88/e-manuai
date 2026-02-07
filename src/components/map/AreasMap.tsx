import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { createAreaIcon } from './AreaMarkerIcon';
import { AreaPopupContent } from './AreaPopup';
import { MapControls } from './MapControls';
import { RoutePolyline } from './RoutePolyline';
import { MarkerClusterGroup } from './MarkerClusterGroup';
import { MachineMarker } from './MachineMarker';

// Fix default marker icons for Leaflet + bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Area {
  id: string;
  nazev: string;
  typ: string;
  plocha_m2: number | null;
  obvod_oploceni_m: number | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  google_maps_link: string | null;
  kategorie_travnate_plochy: string | null;
  okres: string | null;
  poznamky: string | null;
  stroje?: { vyrobni_cislo: string; model: string } | null;
}

interface AreasMapProps {
  areas: Area[];
  className?: string;
  routeAreaIds?: string[];
  onToggleRoute?: (area: Area) => void;
  showRoute?: boolean;
  showMachinePosition?: boolean;
}

function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export function AreasMap({ areas, className, routeAreaIds = [], onToggleRoute, showRoute = false, showMachinePosition = false }: AreasMapProps) {
  const areasWithGps = useMemo(() => areas.filter(a => a.gps_latitude && a.gps_longitude), [areas]);

  const centerLat = useMemo(() => {
    if (areasWithGps.length === 0) return 49.4;
    return areasWithGps.reduce((sum, a) => sum + (a.gps_latitude || 0), 0) / areasWithGps.length;
  }, [areasWithGps]);

  const centerLng = useMemo(() => {
    if (areasWithGps.length === 0) return 14.3;
    return areasWithGps.reduce((sum, a) => sum + (a.gps_longitude || 0), 0) / areasWithGps.length;
  }, [areasWithGps]);

  const routeWaypoints = useMemo(() => {
    if (!showRoute || routeAreaIds.length < 2) return [];
    return routeAreaIds
      .map(id => areasWithGps.find(a => a.id === id))
      .filter((a): a is Area => !!a && !!a.gps_latitude && !!a.gps_longitude)
      .map(a => [a.gps_latitude!, a.gps_longitude!] as [number, number]);
  }, [showRoute, routeAreaIds, areasWithGps]);

  // Register global handlers for popup buttons
  useEffect(() => {
    (window as any).__mapNavigate = (lat: number, lng: number) => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };
    (window as any).__mapToggleRoute = (id: string) => {
      const area = areasWithGps.find(a => a.id === id);
      if (area && onToggleRoute) onToggleRoute(area);
    };
    return () => {
      delete (window as any).__mapNavigate;
      delete (window as any).__mapToggleRoute;
    };
  }, [areasWithGps, onToggleRoute]);

  // Build cluster marker data for non-route markers
  const clusterMarkers = useMemo(() => {
    return areasWithGps
      .filter(area => !routeAreaIds.includes(area.id))
      .map(area => {
        const plocha = area.plocha_m2 ? `${area.plocha_m2.toLocaleString('cs-CZ')} m²` : '—';
        const oploceni = area.obvod_oploceni_m ? `${area.obvod_oploceni_m} m` : '';
        const isInRoute = routeAreaIds.includes(area.id);
        const routeBtnLabel = isInRoute ? 'Odebrat z trasy' : 'Přidat do trasy';
        const routeBtnColor = isInRoute ? '#ef4444' : 'hsl(var(--primary))';

        const navBtn = area.gps_latitude && area.gps_longitude
          ? `<button onclick="window.__mapNavigate(${area.gps_latitude},${area.gps_longitude})" style="flex:1;padding:6px 8px;border:none;border-radius:6px;background:hsl(var(--primary));color:white;font-size:11px;font-weight:600;cursor:pointer;">📍 Navigovat</button>`
          : '';
        const routeBtn = onToggleRoute
          ? `<button onclick="window.__mapToggleRoute('${area.id}')" style="flex:1;padding:6px 8px;border:none;border-radius:6px;background:${routeBtnColor};color:white;font-size:11px;font-weight:600;cursor:pointer;">🗺️ ${routeBtnLabel}</button>`
          : '';

        const popupHtml = `<div style="font-family:sans-serif;font-size:13px;line-height:1.5;">
          <strong style="font-size:14px;">${area.nazev}</strong><br/>
          <span style="opacity:0.7">Vodojem${area.okres ? ' • ' + area.okres : ''}</span><br/>
          <span style="opacity:0.7">Plocha: ${plocha}</span>
          ${oploceni ? '<br/><span style="opacity:0.7">Oplocení: ' + oploceni + '</span>' : ''}
          ${area.kategorie_travnate_plochy ? '<br/><span style="opacity:0.6;font-size:11px;">Kategorie: ' + area.kategorie_travnate_plochy + '</span>' : ''}
          ${area.poznamky ? '<br/><span style="opacity:0.5;font-size:11px;">' + area.poznamky.slice(0, 80) + '</span>' : ''}
          <div style="display:flex;gap:6px;margin-top:8px;">${navBtn}${routeBtn}</div>
        </div>`;
        return {
          id: area.id,
          position: [area.gps_latitude!, area.gps_longitude!] as [number, number],
          icon: createAreaIcon(area.typ, false),
          popupContent: popupHtml,
        };
      });
  }, [areasWithGps, routeAreaIds, onToggleRoute]);

  if (areasWithGps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/30 p-10 text-center">
        <MapPin className="mb-3 h-14 w-14 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">Žádné areály s GPS souřadnicemi</p>
        <p className="mt-1 text-xs text-muted-foreground">Přidejte GPS souřadnice k areálům pro zobrazení na mapě</p>
      </div>
    );
  }

  // Route markers rendered individually (not clustered)
  const routeAreas = areasWithGps.filter(a => routeAreaIds.includes(a.id));

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-xl border border-border">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={10}
          style={{ height: '70vh', minHeight: '500px', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ResizeHandler />
          <MapControls centerLat={centerLat} centerLng={centerLng} />

          {showRoute && routeWaypoints.length >= 2 && (
            <RoutePolyline waypoints={routeWaypoints} />
          )}

          {/* Clustered non-route markers */}
          <MarkerClusterGroup markers={clusterMarkers} />

          {/* Live machine position */}
          {showMachinePosition && <MachineMarker />}

          {/* Route markers (not clustered) */}
          {routeAreas.map(area => {
            const routeIndex = routeAreaIds.indexOf(area.id);
            const icon = createAreaIcon(area.typ, true, routeIndex);
            return (
              <Marker key={area.id} position={[area.gps_latitude!, area.gps_longitude!]} icon={icon}>
                <Popup minWidth={260} maxWidth={320} className="area-popup">
                  <AreaPopupContent
                    area={area}
                    isInRoute={true}
                    onAddToRoute={undefined}
                    onRemoveFromRoute={onToggleRoute ? () => onToggleRoute(area) : undefined}
                  />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
