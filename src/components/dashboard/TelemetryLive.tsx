import React, { useEffect, useState } from 'react';
import { useBarbieriiClient } from '@/hooks/useBarbieriiClient';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Gauge, Navigation, Radio, Battery, Power, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RTK_STATUS_INFO } from '@/types/database';
import type { RtkStav } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TelemetryLive() {
  const {
    telemetry,
    connectionState,
    isConnected,
    connect,
    disconnect,
    emergencyStop,
  } = useBarbieriiClient();
  const { isAdmin } = useAuth();
  const [simulating, setSimulating] = useState(false);

  const isConnecting = connectionState === 'connecting';
  const isStale = connectionState === 'stale';
  // "Waiting": connected but no telemetry packet yet (or disconnected idle)
  const isWaiting = !telemetry && !isConnecting;
  const isLive = connectionState === 'connected' && !!telemetry;

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const rtkInfo = telemetry?.rtkStatus
    ? RTK_STATUS_INFO[telemetry.rtkStatus as RtkStav] || RTK_STATUS_INFO['neznámý']
    : RTK_STATUS_INFO['neznámý'];

  const modeLabels: Record<string, string> = {
    'manual': 'Manuální',
    'semi-auto': 'Poloautonomní',
    'autonomous': 'Autonomní',
    'idle': 'Nečinný',
  };

  // Connection badge label
  const connBadge = isConnecting
    ? { label: 'Připojování…', icon: Clock, cls: 'bg-muted text-muted-foreground' }
    : isStale
    ? { label: 'Neodpovídá', icon: Clock, cls: 'bg-warning/20 text-warning' }
    : isConnected
    ? { label: 'Připojeno', icon: Wifi, cls: 'bg-success/20 text-success' }
    : { label: 'Odpojeno', icon: WifiOff, cls: 'bg-destructive/20 text-destructive' };

  const ConnIcon = connBadge.icon;

  return (
    <div className="dashboard-widget">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Telemetrie
        </h3>
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors', connBadge.cls)}>
            <ConnIcon className="h-3.5 w-3.5" />
            {connBadge.label}
          </div>
          {!isConnected && !isStale && !isConnecting && (
            <Button variant="outline" size="sm" onClick={connect} className="h-8 text-xs">
              Připojit
            </Button>
          )}
        </div>
      </div>

      {/* Stale warning banner */}
      {isStale && telemetry?.timestamp && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Stroj neodpovídá od {telemetry.timestamp.toLocaleTimeString('cs-CZ')}</span>
        </div>
      )}

      {/* "Waiting for data" badge when connected (or about to connect) but no packet */}
      {isWaiting && !isStale && (
        <div className="mb-3">
          <Badge variant="outline" className="gap-1.5 border-warning/40 text-warning">
            <Clock className="h-3 w-3" />
            Čekám na data ze stroje…
          </Badge>
        </div>
      )}

      <div className="space-y-3">
        {/* RTK Status - prominent */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg border-l-4 p-3 transition-colors duration-200',
            isLive && rtkInfo.color === 'success' && 'border-l-success bg-success/10',
            isLive && rtkInfo.color === 'warning' && 'border-l-warning bg-warning/10',
            isLive && rtkInfo.color === 'destructive' && 'border-l-destructive bg-destructive/10',
            !isLive && 'border-l-muted bg-muted/30',
          )}
        >
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5" />
            <div>
              <p className="text-xs text-muted-foreground">RTK Status</p>
              {isConnecting ? (
                <Skeleton className="mt-1 h-6 w-20" />
              ) : (
                <p className="font-mono text-lg font-bold">{isLive ? rtkInfo.label : '—'}</p>
              )}
            </div>
          </div>
          {isLive && <p className="text-xs text-muted-foreground">{rtkInfo.description}</p>}
        </div>

        {/* Telemetry grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Gauge className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Rychlost</p>
              {isConnecting ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <p className="font-mono text-lg font-bold transition-all duration-200">
                  {isLive ? telemetry!.speed.toFixed(1) : '—'}{' '}
                  <span className="text-xs font-normal">km/h</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Power className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Režim</p>
              {isConnecting ? (
                <Skeleton className="mt-1 h-5 w-20" />
              ) : (
                <p className="text-sm font-bold">
                  {isLive ? (modeLabels[telemetry!.mode] || 'Neznámý') : '—'}
                  {isLive && telemetry!.sMode && telemetry!.mode === 'autonomous' && (
                    <span className="ml-1 font-mono text-xs text-muted-foreground">S{telemetry!.sMode}</span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Navigation className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">GPS</p>
              {isConnecting ? (
                <Skeleton className="mt-1 h-4 w-24" />
              ) : (
                <p className="font-mono text-xs">
                  {isLive && telemetry!.position
                    ? `${telemetry!.position.lat.toFixed(5)}°N`
                    : '—'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Battery className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Baterie</p>
              {isConnecting ? (
                <Skeleton className="mt-1 h-6 w-12" />
              ) : (
                <p className="font-mono text-lg font-bold transition-all duration-200">
                  {isLive && telemetry!.batteryLevel != null ? telemetry!.batteryLevel : '—'}
                  <span className="text-xs font-normal">%</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Emergency stop - always available when connected */}
        <Button
          variant="destructive"
          onClick={emergencyStop}
          disabled={!isConnected && !isStale}
          className="h-14 w-full gap-2 text-base font-bold uppercase"
        >
          <AlertTriangle className="h-5 w-5" />
          Nouzové zastavení
        </Button>

        <p className="text-center text-[10px] text-muted-foreground">
          {telemetry?.timestamp
            ? `Poslední aktualizace: ${telemetry.timestamp.toLocaleTimeString('cs-CZ')}`
            : 'Čekání na data…'}
          {' • Supabase Realtime'}
        </p>

        {/* PLC Simulator button for admins */}
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setSimulating(true);
              try {
                const { error } = await supabase.functions.invoke('simulate-telemetry', {
                  method: 'POST',
                  body: {},
                });
                if (error) throw error;
                toast.success('Simulovaná telemetrie odeslána');
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'neznámá';
                toast.error('Chyba simulace: ' + msg);
              } finally {
                setSimulating(false);
              }
            }}
            disabled={simulating}
            className="mt-2 w-full gap-2 text-xs"
          >
            <Zap className="h-3.5 w-3.5" />
            {simulating ? 'Odesílám…' : 'Simulovat telemetrii (DEV)'}
          </Button>
        )}
      </div>
    </div>
  );
}
