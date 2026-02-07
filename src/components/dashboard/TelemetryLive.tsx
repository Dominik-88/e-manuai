import React, { useEffect } from 'react';
import { useBarbieriiClient } from '@/hooks/useBarbieriiClient';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Gauge, Navigation, Radio, Battery, Power, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RTK_STATUS_INFO } from '@/types/database';
import type { RtkStav } from '@/types/database';

export function TelemetryLive() {
  const { 
    telemetry, 
    connectionState, 
    isConnected, 
    connect, 
    disconnect,
    emergencyStop 
  } = useBarbieriiClient();

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

  return (
    <div className="dashboard-widget">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Telemetrie
        </h3>
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            isConnected ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          )}>
            {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {connectionState === 'connecting' ? 'Připojování...' : isConnected ? 'Připojeno' : 'Odpojeno'}
          </div>
          {!isConnected && (
            <Button variant="outline" size="sm" onClick={connect} className="h-8 text-xs">
              Připojit
            </Button>
          )}
        </div>
      </div>

      {!isConnected && connectionState !== 'connecting' ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          <WifiOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p>Čekání na data ze stroje</p>
          <p className="mt-2 text-xs">Stroj zatím neodesílá telemetrii</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* RTK Status - prominent */}
          <div className={cn(
            'flex items-center justify-between rounded-lg border-l-4 p-3',
            rtkInfo.color === 'success' && 'border-l-success bg-success/10',
            rtkInfo.color === 'warning' && 'border-l-warning bg-warning/10',
            rtkInfo.color === 'destructive' && 'border-l-destructive bg-destructive/10',
          )}>
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5" />
              <div>
                <p className="text-xs text-muted-foreground">RTK Status</p>
                <p className="font-mono text-lg font-bold">{rtkInfo.label}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{rtkInfo.description}</p>
          </div>

          {/* Telemetry grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Gauge className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Rychlost</p>
                <p className="font-mono text-lg font-bold">
                  {telemetry?.speed?.toFixed(1) || '0.0'} <span className="text-xs font-normal">km/h</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Power className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Režim</p>
                <p className="text-sm font-bold">
                  {modeLabels[telemetry?.mode || 'idle'] || 'Neznámý'}
                  {telemetry?.sMode && telemetry.mode === 'autonomous' && (
                    <span className="ml-1 font-mono text-xs text-muted-foreground">S{telemetry.sMode}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Navigation className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">GPS</p>
                <p className="font-mono text-xs">
                  {telemetry?.position 
                    ? `${telemetry.position.lat.toFixed(5)}°N`
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Battery className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Baterie</p>
                <p className="font-mono text-lg font-bold">
                  {telemetry?.batteryLevel ?? '—'}<span className="text-xs font-normal">%</span>
                </p>
              </div>
            </div>
          </div>

          {/* Emergency stop */}
          <Button 
            variant="destructive" 
            onClick={emergencyStop}
            className="h-14 w-full gap-2 text-base font-bold uppercase"
          >
            <AlertTriangle className="h-5 w-5" />
            Nouzové zastavení
          </Button>

          <p className="text-center text-[10px] text-muted-foreground">
            {telemetry?.timestamp 
              ? `Poslední aktualizace: ${telemetry.timestamp.toLocaleTimeString('cs-CZ')}`
              : 'Čekání na data...'
            }
            {' • Supabase Realtime'}
          </p>
        </div>
      )}
    </div>
  );
}
