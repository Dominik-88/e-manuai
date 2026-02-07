// Barbieri XRot 95 EVO - Supabase Realtime Telemetry Client
// Subscribes to postgres_changes on telemetrie_stroje table

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface TelemetryData {
  rtkStatus: 'FIX' | 'FLOAT' | 'NONE' | 'unknown';
  speed: number;
  position: { lat: number; lng: number } | null;
  gpsStatus: string;
  batteryLevel: number | null;
  mode: 'manual' | 'semi-auto' | 'autonomous' | 'idle';
  sMode: number | null;
  mth: number;
  hdop: number | null;
  timestamp: Date;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'stale' | 'error';

type TelemetryListener = (data: TelemetryData) => void;
type ConnectionListener = (state: ConnectionState) => void;

function mapRtkStatus(raw: string | null): TelemetryData['rtkStatus'] {
  if (!raw) return 'unknown';
  const upper = raw.toUpperCase();
  if (upper === 'FIX') return 'FIX';
  if (upper === 'FLOAT') return 'FLOAT';
  if (upper === 'NONE') return 'NONE';
  return 'unknown';
}

function mapMode(raw: string | null): TelemetryData['mode'] {
  if (!raw) return 'idle';
  const lower = raw.toLowerCase();
  if (lower === 'autonomous') return 'autonomous';
  if (lower === 'semi-auto') return 'semi-auto';
  if (lower === 'manual') return 'manual';
  return 'idle';
}

function rowToTelemetry(row: Record<string, unknown>): TelemetryData {
  const lat = row.latitude as number | null;
  const lng = row.longitude as number | null;

  return {
    rtkStatus: mapRtkStatus(row.rtk_status as string | null),
    speed: (row.speed as number) || 0,
    position: lat && lng ? { lat, lng } : null,
    gpsStatus: (row.rtk_status as string) || 'unknown',
    batteryLevel: (row.battery_level as number) ?? null,
    mode: mapMode(row.mode as string | null),
    sMode: (row.s_mode as number) ?? null,
    mth: (row.mth as number) || 0,
    hdop: (row.hdop as number) ?? null,
    timestamp: new Date(row.updated_at as string),
  };
}

export class BarbieriRealtimeClient {
  private connectionState: ConnectionState = 'disconnected';
  private telemetryListeners: TelemetryListener[] = [];
  private connectionListeners: ConnectionListener[] = [];
  private channel: RealtimeChannel | null = null;
  private lastTelemetry: TelemetryData | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private static WATCHDOG_TIMEOUT = 60_000; // 60 seconds

  get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  get currentState(): ConnectionState {
    return this.connectionState;
  }

  get latestTelemetry(): TelemetryData | null {
    return this.lastTelemetry;
  }

  async connect(): Promise<void> {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') return;
    this.setConnectionState('connecting');

    try {
      // Load initial data
      const { data, error } = await supabase
        .from('telemetrie_stroje')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[Barbieri RT] Initial fetch error:', error);
      } else if (data) {
        const telemetry = rowToTelemetry(data);
        this.lastTelemetry = telemetry;
        this.telemetryListeners.forEach(l => l(telemetry));
      }

      // Subscribe to realtime changes
      this.channel = supabase
        .channel('telemetry-live')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'telemetrie_stroje',
          },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            if (row && Object.keys(row).length > 0) {
              const telemetry = rowToTelemetry(row);
              this.lastTelemetry = telemetry;
              this.telemetryListeners.forEach(l => l(telemetry));
              this.resetWatchdog();
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.setConnectionState('connected');
          } else if (status === 'CHANNEL_ERROR') {
            this.setConnectionState('error');
          } else if (status === 'CLOSED') {
            this.setConnectionState('disconnected');
          }
        });
    } catch (err) {
      console.error('[Barbieri RT] Connect error:', err);
      this.setConnectionState('error');
    }
  }

  disconnect(): void {
    this.clearWatchdog();
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.setConnectionState('disconnected');
  }

  onTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.push(listener);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter(l => l !== listener);
    };
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  emergencyStop(): void {
    console.log('[Barbieri RT] EMERGENCY STOP requested');
    // In production, this would call an edge function to send stop command
  }

  loadRoute(routeName: string): void {
    console.log(`[Barbieri RT] Load route: ${routeName}`);
  }

  startAutonomous(sMode: number): void {
    console.log(`[Barbieri RT] Start autonomous S-Mode ${sMode}`);
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionListeners.forEach(l => l(state));
  }

  private resetWatchdog(): void {
    this.clearWatchdog();
    // If connected, start watchdog — if no new data in 60s, go stale
    if (this.connectionState === 'connected' || this.connectionState === 'stale') {
      // Restore to connected if we were stale
      if (this.connectionState === 'stale') {
        this.setConnectionState('connected');
      }
      this.watchdogTimer = setTimeout(() => {
        if (this.connectionState === 'connected') {
          console.warn('[Barbieri RT] Watchdog: no data for 60s, marking stale');
          this.setConnectionState('stale');
        }
      }, BarbieriRealtimeClient.WATCHDOG_TIMEOUT);
    }
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }
}

// Singleton
let clientInstance: BarbieriRealtimeClient | null = null;

export function getBarbieriClient(): BarbieriRealtimeClient {
  if (!clientInstance) {
    clientInstance = new BarbieriRealtimeClient();
  }
  return clientInstance;
}
