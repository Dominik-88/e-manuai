import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface AreaProgressBarProps {
  totalCount: number;
  doneTodayCount: number;
  totalAreaM2: number;
  doneAreaM2: number;
  highPriorityCount: number;
}

export function AreaProgressBar({
  totalCount,
  doneTodayCount,
  totalAreaM2,
  doneAreaM2,
  highPriorityCount,
}: AreaProgressBarProps) {
  const pctCount = totalCount > 0 ? Math.round((doneTodayCount / totalCount) * 100) : 0;
  const pctArea = totalAreaM2 > 0 ? Math.round((doneAreaM2 / totalAreaM2) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card/60 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-sm font-semibold">Dnešní pokrok</span>
        </div>
        {highPriorityCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span className="text-[10px] font-bold text-destructive">
              {highPriorityCount} přerůstá
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Areály</span>
            <span className="font-mono text-xs font-bold">
              {doneTodayCount}/{totalCount}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${pctCount}%` }}
              role="progressbar"
              aria-valuenow={pctCount}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">{pctCount} %</div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Plocha</span>
            <span className="font-mono text-xs font-bold">
              {(doneAreaM2 / 1000).toFixed(1)}/{(totalAreaM2 / 1000).toFixed(1)} k m²
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-info transition-all duration-500"
              style={{ width: `${pctArea}%` }}
              role="progressbar"
              aria-valuenow={pctArea}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">{pctArea} %</div>
        </div>
      </div>
    </div>
  );
}
