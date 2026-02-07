import React, { useEffect, useState } from 'react';
import { useBarbieriiClient } from '@/hooks/useBarbieriiClient';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Gauge, Navigation, Radio, Battery, Power, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    emergencyStop 
  } = useBarbieriiClient();
  const { isAdmin } = useAuth();
  const [simulating, setSimulating] = useState(false);
  const isStale = connectionState === 'stale';

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
            isStale ? 'bg-warning/20 text-warning' :
            isConnected ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          )}>
            {isStale ? <Clock className="h-3.5 w-3.5" /> : isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {connectionState === 'connecting' ? 'Připojování...' : isStale ? 'Neodpovídá' : isConnected ? 'Připojeno' : 'Odpojeno'}
          </div>
          {!isConnected && connectionState !== 'stale' && (
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

      {!isConnected && !isStale && connectionState !== 'connecting' ? (
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

          {/* PLC Simulator button for admins */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setSimulating(true);
                try {
                  const { data, error } = await supabase.functions.invoke('simulate-telemetry', {
                    method: 'POST',
                    body: {},
                  });
                  if (error) throw error;
                  toast.success('Simulovaná telemetrie odeslána');
                } catch (err: any) {
                  toast.error('Chyba simulace: ' + (err.message || 'neznámá'));
                } finally {
                  setSimulating(false);
                }
              }}
              disabled={simulating}
              className="mt-2 w-full gap-2 text-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              {simulating ? 'Odesílám...' : 'Simulovat telemetrii (DEV)'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
