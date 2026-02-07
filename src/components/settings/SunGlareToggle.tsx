import React from 'react';
import { Sun, SunMedium, Vibrate } from 'lucide-react';
import { useSunGlare, hapticFeedback } from '@/hooks/useSunGlare';
import { cn } from '@/lib/utils';

export function SunGlareToggle() {
  const { isGlareMode, toggle, autoEnabled, toggleAuto, ambientLux } = useSunGlare();

  return (
    <div className="space-y-3">
      {/* Sun-Glare toggle */}
      <button
        onClick={() => {
          toggle();
          hapticFeedback('ok');
        }}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border p-4 transition-colors',
          isGlareMode
            ? 'border-warning bg-warning/10'
            : 'border-border bg-card'
        )}
        aria-label="Přepnout režim proti slunci"
      >
        <div className="flex items-center gap-3">
          <Sun className={cn('h-6 w-6', isGlareMode ? 'text-warning' : 'text-muted-foreground')} />
          <div className="text-left">
            <p className="font-medium">Sun-Glare režim</p>
            <p className="text-xs text-muted-foreground">
              Extrémní kontrast pro přímé slunce
            </p>
          </div>
        </div>
        <div className={cn(
          'h-6 w-11 rounded-full transition-colors',
          isGlareMode ? 'bg-warning' : 'bg-muted'
        )}>
          <div className={cn(
            'h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform',
            isGlareMode ? 'translate-x-5' : 'translate-x-0.5'
          )} />
        </div>
      </button>

      {/* Auto-detect toggle */}
      {'AmbientLightSensor' in window && (
        <button
          onClick={toggleAuto}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border p-4 transition-colors',
            autoEnabled ? 'border-info bg-info/10' : 'border-border bg-card'
          )}
        >
          <div className="flex items-center gap-3">
            <SunMedium className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Auto-detekce osvětlení</p>
              {ambientLux !== null && (
                <p className="text-xs text-muted-foreground">{Math.round(ambientLux)} lux</p>
              )}
            </div>
          </div>
          <div className={cn(
            'h-6 w-11 rounded-full transition-colors',
            autoEnabled ? 'bg-info' : 'bg-muted'
          )}>
            <div className={cn(
              'h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform',
              autoEnabled ? 'translate-x-5' : 'translate-x-0.5'
            )} />
          </div>
        </button>
      )}

      {/* Test haptics */}
      <button
        onClick={() => hapticFeedback('warning')}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
      >
        <Vibrate className="h-5 w-5 text-muted-foreground" />
        <div className="text-left">
          <p className="text-sm font-medium">Test haptické odezvy</p>
          <p className="text-xs text-muted-foreground">Vibrační upozornění při kritických stavech</p>
        </div>
      </button>
    </div>
  );
}
