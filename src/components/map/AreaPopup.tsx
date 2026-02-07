import React from 'react';
import { Navigation, ExternalLink, Plus, Minus, Ruler, Fence } from 'lucide-react';
import { OKRES_NAMES } from '@/types/database';
import type { OkresCode } from '@/types/database';
import { getTypeConfig } from './AreaMarkerIcon';

interface AreaPopupProps {
  area: {
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
  };
  isInRoute?: boolean;
  onAddToRoute?: () => void;
  onRemoveFromRoute?: () => void;
}

export function AreaPopupContent({ area, isInRoute, onAddToRoute, onRemoveFromRoute }: AreaPopupProps) {
  const config = getTypeConfig(area.typ);
  
  const openNavigation = () => {
    if (!area.gps_latitude || !area.gps_longitude) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${area.gps_latitude},${area.gps_longitude}&travelmode=driving`,
      '_blank'
    );
  };

  return (
    <div className="min-w-[240px] max-w-[300px] space-y-2.5 p-1">
      {/* Header with type badge */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
          style={{ background: `${config.color}22`, border: `2px solid ${config.color}` }}
        >
          {config.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-tight text-foreground">{area.nazev}</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="capitalize">{area.typ}</span>
            {area.okres && (
              <>
                <span>·</span>
                <span>{OKRES_NAMES[area.okres as OkresCode] || area.okres}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-1.5">
        {area.plocha_m2 != null && (
          <div className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
            <Ruler className="h-3 w-3 text-primary" />
            <span>{area.plocha_m2.toLocaleString('cs-CZ')} m²</span>
          </div>
        )}
        {area.obvod_oploceni_m != null && (
          <div className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-medium">
            <Fence className="h-3 w-3 text-success" />
            <span>{area.obvod_oploceni_m} bm</span>
          </div>
        )}
      </div>

      {/* Extra info */}
      {area.kategorie_travnate_plochy && (
        <div className="text-xs text-muted-foreground">
          Kat. TZ: <strong className="text-foreground">{area.kategorie_travnate_plochy}</strong>
        </div>
      )}

      {area.stroje && (
        <div className="text-xs text-info">
          🚜 Stroj: {(area.stroje as any).vyrobni_cislo}
        </div>
      )}

      {area.poznamky && (
        <p className="text-xs text-muted-foreground line-clamp-2 italic">{area.poznamky}</p>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 pt-1">
        <button
          onClick={openNavigation}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
        >
          <Navigation className="h-3.5 w-3.5" />
          Navigovat
        </button>

        {onAddToRoute && !isInRoute && (
          <button
            onClick={onAddToRoute}
            className="flex items-center gap-1 rounded-lg bg-info/20 px-3 py-2.5 text-xs font-semibold text-info transition-colors hover:bg-info/30 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Trasa
          </button>
        )}

        {onRemoveFromRoute && isInRoute && (
          <button
            onClick={onRemoveFromRoute}
            className="flex items-center gap-1 rounded-lg bg-destructive/20 px-3 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/30 active:scale-95"
          >
            <Minus className="h-3.5 w-3.5" />
            Odebrat
          </button>
        )}

        {area.google_maps_link && (
          <a
            href={area.google_maps_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* GPS coords */}
      {area.gps_latitude && area.gps_longitude && (
        <div className="text-center font-mono text-[10px] text-muted-foreground">
          {area.gps_latitude.toFixed(5)}°N, {area.gps_longitude.toFixed(5)}°E
        </div>
      )}
    </div>
  );
}
