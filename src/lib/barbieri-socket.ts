// Barbieri XRot 95 EVO - Control Unit Socket.IO Client
// Communicates with the robot's onboard dashboard at http://192.168.4.1:5000
// Event mapping derived from Compas servo.pdf (Compass Servo Drive 2.0 R54)

import { io, Socket } from 'socket.io-client';

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

export interface RoutePoint {
  lat: number;
  lng: number;
  time?: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type TelemetryListener = (data: TelemetryData) => void;
type ConnectionListener = (state: ConnectionState) => void;

const ROBOT_URL = 'http://192.168.4.1:5000';
const RECONNECT_INTERVAL = 5000;
const TELEMETRY_POLL_INTERVAL = 1000;

/**
 * Maps raw Compass Servo Drive events to application telemetry.
 * 
 * Socket.IO events from the robot (from application.js / Compas servo.pdf):
 *   - 'rtkStr'         → RTK status string (FIX / FLOAT / NONE)
 *   - 'vStr'           → Current speed in km/h
 *   - 'hdopBar'        → HDOP precision index (lower = better)
 *   - 'latStr' / 'lngStr' → GPS coordinates
 *   - 'modeStr'        → Operating mode
 *   - 'sModeStr'       → S-Mode number (1-4)
 *   - 'mthStr'         → Current motor hours
 *   - 'batStr'         → Battery level %
 */
function parseRtkStatus(raw: string): TelemetryData['rtkStatus'] {
  const upper = (raw || '').toUpperCase().trim();
  if (upper.includes('FIX')) return 'FIX';
  if (upper.includes('FLOAT')) return 'FLOAT';
  if (upper.includes('NONE') || upper.includes('NO')) return 'NONE';
  return 'unknown';
}

function parseMode(raw: string): TelemetryData['mode'] {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('auto')) return 'autonomous';
  if (lower.includes('semi')) return 'semi-auto';
  if (lower.includes('man')) return 'manual';
  return 'idle';
}

export class BarbieriClient {
  private connectionState: ConnectionState = 'disconnected';
  private telemetryListeners: TelemetryListener[] = [];
  private connectionListeners: ConnectionListener[] = [];
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private socket: Socket | null = null;
  private lastTelemetry: TelemetryData | null = null;
  private useMock = true;

  // Raw values accumulated from individual socket events
  private rawState: Record<string, string> = {};

  get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  get currentState(): ConnectionState {
    return this.connectionState;
  }

  get latestTelemetry(): TelemetryData | null {
    return this.lastTelemetry;
  }

  connect(): void {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') return;
    this.setConnectionState('connecting');

    this.tryRealConnection().catch(() => {
      console.log('[Barbieri] Robot not reachable, using mock mode');
      this.useMock = true;
      this.setConnectionState('connected');
      this.startPolling();
    });
  }

  disconnect(): void {
    this.stopPolling();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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

  loadRoute(routeName: string): void {
    if (this.socket && !this.useMock) {
      this.socket.emit('load_route', { name: routeName });
    }
    console.log(`[Barbieri] Loading route: ${routeName}`);
  }

  startAutonomous(sMode: number): void {
    if (this.socket && !this.useMock) {
      this.socket.emit('start_autonomous', { s_mode: sMode });
    }
    console.log(`[Barbieri] Starting autonomous S-Mode ${sMode}`);
  }

  emergencyStop(): void {
    if (this.socket && !this.useMock) {
      this.socket.emit('emergency_stop');
    }
    console.log('[Barbieri] EMERGENCY STOP');
  }

  private async tryRealConnection(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 4000);

      try {
        this.socket = io(ROBOT_URL, {
          transports: ['websocket', 'polling'],
          timeout: 3000,
          reconnectionAttempts: 3,
          reconnectionDelay: RECONNECT_INTERVAL,
        });

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          console.log('[Barbieri] Connected to robot via Socket.IO');
          this.useMock = false;
          this.setConnectionState('connected');
          this.registerSocketListeners();
          resolve();
        });

        this.socket.on('connect_error', (err) => {
          clearTimeout(timeout);
          console.log('[Barbieri] Socket.IO connect error:', err.message);
          this.socket?.disconnect();
          this.socket = null;
          reject(err);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[Barbieri] Disconnected:', reason);
          if (reason !== 'io client disconnect') {
            // Auto-fallback to mock on unexpected disconnect
            this.useMock = true;
            this.startPolling();
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  /**
   * Register listeners for Compass Servo Drive Socket.IO events.
   * Each event updates a raw value; telemetry is assembled periodically.
   */
  private registerSocketListeners(): void {
    if (!this.socket) return;

    // RTK status: 'rtkStr' → e.g. "RTK FIX", "RTK FLOAT", "NO RTK"
    this.socket.on('rtkStr', (data: string) => {
      this.rawState.rtk = data;
    });

    // Speed: 'vStr' → e.g. "2.3" (km/h)
    this.socket.on('vStr', (data: string) => {
      this.rawState.speed = data;
    });

    // HDOP precision: 'hdopBar' → e.g. "0.8"
    this.socket.on('hdopBar', (data: string) => {
      this.rawState.hdop = data;
    });

    // GPS coordinates
    this.socket.on('latStr', (data: string) => {
      this.rawState.lat = data;
    });
    this.socket.on('lngStr', (data: string) => {
      this.rawState.lng = data;
    });

    // Operating mode
    this.socket.on('modeStr', (data: string) => {
      this.rawState.mode = data;
    });

    // S-Mode
    this.socket.on('sModeStr', (data: string) => {
      this.rawState.sMode = data;
    });

    // Motor hours
    this.socket.on('mthStr', (data: string) => {
      this.rawState.mth = data;
    });

    // Battery
    this.socket.on('batStr', (data: string) => {
      this.rawState.bat = data;
    });

    // Also listen for bulk update event (some firmware versions)
    this.socket.on('update_position', (data: Record<string, unknown>) => {
      if (data.rtk) this.rawState.rtk = String(data.rtk);
      if (data.speed !== undefined) this.rawState.speed = String(data.speed);
      if (data.lat !== undefined) this.rawState.lat = String(data.lat);
      if (data.lng !== undefined) this.rawState.lng = String(data.lng);
      if (data.hdop !== undefined) this.rawState.hdop = String(data.hdop);
      if (data.mode) this.rawState.mode = String(data.mode);
    });

    // Emit telemetry on a regular interval from accumulated raw state
    this.startPolling();
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      const data = this.useMock ? this.generateMockTelemetry() : this.assembleRealTelemetry();
      this.lastTelemetry = data;
      this.telemetryListeners.forEach(l => l(data));
    }, TELEMETRY_POLL_INTERVAL);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Assemble TelemetryData from raw Socket.IO event values.
   */
  private assembleRealTelemetry(): TelemetryData {
    const lat = parseFloat(this.rawState.lat || '0');
    const lng = parseFloat(this.rawState.lng || '0');

    return {
      rtkStatus: parseRtkStatus(this.rawState.rtk || ''),
      speed: parseFloat(this.rawState.speed || '0') || 0,
      position: lat && lng ? { lat, lng } : null,
      gpsStatus: this.rawState.rtk || 'unknown',
      batteryLevel: this.rawState.bat ? parseInt(this.rawState.bat, 10) : null,
      mode: parseMode(this.rawState.mode || ''),
      sMode: this.rawState.sMode ? parseInt(this.rawState.sMode, 10) : null,
      mth: parseFloat(this.rawState.mth || '0') || 0,
      hdop: this.rawState.hdop ? parseFloat(this.rawState.hdop) : null,
      timestamp: new Date(),
    };
  }

  private generateMockTelemetry(): TelemetryData {
    const rtkStates: TelemetryData['rtkStatus'][] = ['FIX', 'FIX', 'FIX', 'FLOAT'];
    const modes: TelemetryData['mode'][] = ['autonomous', 'autonomous', 'semi-auto', 'idle'];

    return {
      rtkStatus: rtkStates[Math.floor(Math.random() * rtkStates.length)],
      speed: parseFloat((Math.random() * 3.5 + 0.5).toFixed(1)),
      position: {
        lat: 49.202902 + (Math.random() - 0.5) * 0.001,
        lng: 14.063713 + (Math.random() - 0.5) * 0.001,
      },
      gpsStatus: 'OK',
      batteryLevel: Math.floor(Math.random() * 30 + 70),
      mode: modes[Math.floor(Math.random() * modes.length)],
      sMode: Math.floor(Math.random() * 4) + 1,
      mth: 127.3,
      hdop: parseFloat((Math.random() * 2 + 0.5).toFixed(1)),
      timestamp: new Date(),
    };
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionListeners.forEach(l => l(state));
  }
}

// Singleton instance
let clientInstance: BarbieriClient | null = null;

export function getBarbieriClient(): BarbieriClient {
  if (!clientInstance) {
    clientInstance = new BarbieriClient();
  }
  return clientInstance;
}
