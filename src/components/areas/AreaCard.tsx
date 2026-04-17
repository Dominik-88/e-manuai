import { CheckCircle2, Circle, MapPin, Ruler, Trash2, Undo2, Navigation2, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OKRES_NAMES } from '@/types/database';
import type { OkresCode } from '@/types/database';
import { getTypeConfig } from '@/components/map/AreaMarkerIcon';
import type { AreaStatus } from '@/hooks/useAreaStatuses';
import { cn } from '@/lib/utils';

export interface AreaCardArea {
  id: string;
  nazev: string;
  typ: string;
  plocha_m2: number | null;
  obvod_oploceni_m: number | null;
  okres: string | null;
  kategorie_travnate_plochy: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  poznamky: string | null;
}

interface AreaCardProps {
  area: AreaCardArea;
  status: AreaStatus;
  isNearest?: boolean;
  isInRoute?: boolean;
  canDelete?: boolean;
  onToggleMowed: () => void;
  onUndoMowed: () => void;
  onDelete?: () => void;
}

function relativeMowedLabel(status: AreaStatus): string {
  if (status.isMowedToday) return 'Posekáno dnes';
  if (status.daysSince === null) return 'Nikdy neposekáno';
  if (status.daysSince === 1) return 'Před 1 dnem';
  if (status.daysSince < 7) return `Před ${status.daysSince} dny`;
  if (status.daysSince < 14) return `${status.daysSince} dní bez sečení`;
  return `⚠️ ${status.daysSince} dní – přerůstá`;
}

export function AreaCard({
  area,
  status,
  isNearest,
  isInRoute,
  canDelete,
  onToggleMowed,
  onUndoMowed,
  onDelete,
}: AreaCardProps) {
  const typeConfig = getTypeConfig(area.typ);
  const isDone = status.isMowedToday;
  const isHigh = status.priority === 'high' || status.priority === 'never';

  return (
    <div
      className={cn(
        'glass-card group relative overflow-hidden rounded-2xl transition-all duration-300',
        isDone && 'border-success/40 bg-success/5 shadow-[0_4px_24px_-8px_hsl(var(--success)/0.3)]',
        isHigh && !isDone && 'border-destructive/40 priority-pulse',
        isNearest && !isDone && 'nearest-pulse ring-2 ring-info/60',
      )}
    >
      {/* Color accent strip */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: isDone ? 'hsl(var(--success))' : typeConfig.color }}
      />

      <div className="flex items-start gap-3 p-3.5 pl-5">
        {/* Toggle button — primary action, large touch target */}
        <button
          onClick={isDone ? onUndoMowed : onToggleMowed}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90',
            isDone
              ? 'bg-success text-success-foreground shadow-md shadow-success/40'
              : 'bg-muted/60 text-muted-foreground hover:bg-success/20 hover:text-success',
          )}
          aria-label={isDone ? `Vrátit zpět – ${area.nazev}` : `Označit jako posekáno – ${area.nazev}`}
        >
          {isDone ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" strokeWidth={2.2} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{typeConfig.emoji}</span>
            <h3 className={cn('truncate font-semibold leading-tight', isDone && 'line-through opacity-70')}>
              {area.nazev}
            </h3>
            {isNearest && (
              <Badge className="shrink-0 bg-info/20 text-info border-info/40 text-[10px] gap-0.5 px-1.5">
                <Navigation2 className="h-2.5 w-2.5" />
                Tady
              </Badge>
            )}
            {isInRoute && (
              <Badge className="shrink-0 bg-info/20 text-info border-info/30 text-[10px]">v trase</Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {area.okres && <span>{OKRES_NAMES[area.okres as OkresCode] || area.okres}</span>}
            {area.plocha_m2 != null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {area.plocha_m2.toLocaleString('cs-CZ')} m²
              </span>
            )}
            {area.kategorie_travnate_plochy && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                kat. {area.kategorie_travnate_plochy}
              </Badge>
            )}
          </div>

          <div
            className={cn(
              'mt-1.5 flex items-center gap-1 text-[11px] font-medium',
              isDone && 'text-success',
              !isDone && status.priority === 'ok' && 'text-success/80',
              !isDone && status.priority === 'medium' && 'text-warning',
              !isDone && (status.priority === 'high' || status.priority === 'never') && 'text-destructive',
            )}
          >
            {isHigh && !isDone ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            <span>{relativeMowedLabel(status)}</span>
          </div>

          {area.poznamky && (
            <p className="mt-1 text-[11px] italic text-muted-foreground line-clamp-1">{area.poznamky}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {isDone && (
            <button
              onClick={onUndoMowed}
              className="flex h-9 items-center gap-1 rounded-lg bg-muted/60 px-2 text-[11px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
              aria-label={`Vrátit zpět – ${area.nazev}`}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Zpět
            </button>
          )}
          {canDelete && onDelete && !isDone && (
            <button
              onClick={onDelete}
              className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              aria-label={`Smazat ${area.nazev}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {area.gps_latitude != null && area.gps_longitude != null && (
            <span className="flex items-center gap-0.5 font-mono text-[9px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {area.gps_latitude.toFixed(3)}°
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
