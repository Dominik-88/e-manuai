import React, { useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { Crosshair, LocateFixed, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface MapControlsProps {
  centerLat: number;
  centerLng: number;
}

export function MapControls({ centerLat, centerLng }: MapControlsProps) {
  const map = useMap();

  const handleCenter = useCallback(() => {
    map.setView([centerLat, centerLng], 10, { animate: true });
  }, [map, centerLat, centerLng]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolokace není dostupná');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
        toast.success('Vaše poloha nalezena');
      },
      () => {
        toast.error('Nepodařilo se získat polohu');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [map]);

  const buttonClass = "flex h-9 w-9 items-center justify-center rounded-lg bg-card/90 text-foreground shadow-lg backdrop-blur-sm border border-border transition-colors hover:bg-muted active:scale-95";

  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
      <button onClick={() => map.zoomIn()} className={buttonClass} aria-label="Přiblížit">
        <ZoomIn className="h-4 w-4" />
      </button>
      <button onClick={() => map.zoomOut()} className={buttonClass} aria-label="Oddálit">
        <ZoomOut className="h-4 w-4" />
      </button>
      <div className="my-0.5" />
      <button onClick={handleCenter} className={buttonClass} aria-label="Centrovit mapu">
        <Crosshair className="h-4 w-4" />
      </button>
      <button onClick={handleLocate} className={buttonClass} aria-label="Moje poloha">
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  );
}
