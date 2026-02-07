import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Ruler, Fence, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OKRES_NAMES } from '@/types/database';
import type { OkresCode } from '@/types/database';

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
}

interface AreasMapProps {
  areas: Area[];
  className?: string;
}

const typIcons: Record<string, string> = {
  vodojem: '💧',
  'úpravna vody': '🔧',
  'čerpací stanice': '⛽',
  vrt: '🕳️',
  vinice: '🍇',
  sad: '🍎',
  park: '🌳',
  zahrada: '🌻',
  jiné: '📍',
};

// Fix tiles not rendering when map container was initially hidden
function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export function AreasMap({ areas, className }: AreasMapProps) {
  const areasWithGps = areas.filter(a => a.gps_latitude && a.gps_longitude);

  if (areasWithGps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-8 text-center">
        <MapPin className="mb-3 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Žádné areály s GPS souřadnicemi
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Přidejte GPS souřadnice k areálům pro zobrazení na mapě
        </p>
      </div>
    );
  }

  // Calculate center from all points
  const centerLat = areasWithGps.reduce((sum, a) => sum + (a.gps_latitude || 0), 0) / areasWithGps.length;
  const centerLng = areasWithGps.reduce((sum, a) => sum + (a.gps_longitude || 0), 0) / areasWithGps.length;

  const openNavigation = (lat: number, lng: number, name: string) => {
    // Try native navigation first, fallback to Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className={className}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={10}
        style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeHandler />
        {areasWithGps.map(area => (
          <Marker
            key={area.id}
            position={[area.gps_latitude!, area.gps_longitude!]}
          >
            <Popup minWidth={240} maxWidth={300}>
              <div className="space-y-2 p-1">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typIcons[area.typ] || '📍'}</span>
                  <div>
                    <h3 className="text-sm font-bold leading-tight">{area.nazev}</h3>
                    {area.okres && (
                      <span className="text-xs text-gray-500">
                        {OKRES_NAMES[area.okres as OkresCode] || area.okres}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {area.plocha_m2 && (
                    <div className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1">
                      <Ruler className="h-3 w-3 text-blue-600" />
                      <span>{area.plocha_m2.toLocaleString('cs-CZ')} m²</span>
                    </div>
                  )}
                  {area.obvod_oploceni_m && (
                    <div className="flex items-center gap-1 rounded bg-green-50 px-2 py-1">
                      <Fence className="h-3 w-3 text-green-600" />
                      <span>{area.obvod_oploceni_m} bm</span>
                    </div>
                  )}
                </div>

                {area.kategorie_travnate_plochy && (
                  <div className="text-xs text-gray-500">
                    Kategorie TZ: <strong>{area.kategorie_travnate_plochy}</strong>
                  </div>
                )}

                {area.poznamky && (
                  <p className="text-xs text-gray-400 line-clamp-2">{area.poznamky}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openNavigation(area.gps_latitude!, area.gps_longitude!, area.nazev)}
                    className="flex flex-1 items-center justify-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Navigovat
                  </button>
                  {area.google_maps_link && (
                    <a
                      href={area.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Mapa
                    </a>
                  )}
                </div>

                {/* GPS coords */}
                <div className="text-center font-mono text-[10px] text-gray-400">
                  {area.gps_latitude?.toFixed(5)}°N, {area.gps_longitude?.toFixed(5)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
