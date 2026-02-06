// Barbieri XRot 95 EVO - Control Unit Socket.IO Client
// Communicates with the robot's onboard dashboard at http://192.168.4.1:5000

export interface TelemetryData {
  rtkStatus: 'FIX' | 'FLOAT' | 'NONE' | 'unknown';
  speed: number;
  position: { lat: number; lng: number } | null;
  gpsStatus: string;
  batteryLevel: number | null;
  mode: 'manual' | 'semi-auto' | 'autonomous' | 'idle';
  sMode: number | null;
  mth: number;
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
 * Client wrapper for Barbieri XRot 95 EVO control unit.
 * 
 * NOTE: Socket.IO integration requires direct LAN access to the robot.
 * When not on the robot's network, operates in mock/demo mode.
 * 
 * Real implementation requires reverse-engineering events from
 * the robot's static/js/application.js file.
 */
export class BarbieriClient {
  private connectionState: ConnectionState = 'disconnected';
  private telemetryListeners: TelemetryListener[] = [];
  private connectionListeners: ConnectionListener[] = [];
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastTelemetry: TelemetryData | null = null;
  private useMock = true; // Default to mock until real connection available

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
    this.setConnectionState('connecting');
    
    // Attempt real connection
    this.tryRealConnection().catch(() => {
      console.log('[Barbieri] Robot not reachable, using mock mode');
      this.useMock = true;
      this.setConnectionState('connected');
      this.startPolling();
    });
  }

  disconnect(): void {
    this.stopPolling();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
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
    console.log(`[Barbieri] Loading route: ${routeName}`);
    // In real implementation: this.socket.emit('load_route', { name: routeName });
  }

  startAutonomous(sMode: number): void {
    console.log(`[Barbieri] Starting autonomous S-Mode ${sMode}`);
    // In real implementation: this.socket.emit('start_autonomous', { s_mode: sMode });
  }

  emergencyStop(): void {
    console.log('[Barbieri] EMERGENCY STOP');
    // In real implementation: this.socket.emit('emergency_stop');
  }

  private async tryRealConnection(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch(ROBOT_URL, { 
        signal: controller.signal,
        mode: 'no-cors'
      });
      clearTimeout(timeout);
      
      // If we get here, the robot is reachable
      this.useMock = false;
      this.setConnectionState('connected');
      this.startPolling();
    } catch {
      clearTimeout(timeout);
      throw new Error('Robot not reachable');
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      const data = this.useMock ? this.generateMockTelemetry() : this.fetchRealTelemetry();
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

  private fetchRealTelemetry(): TelemetryData {
    // Real implementation would parse data from Socket.IO events:
    // socket.on('update_position', (data) => ...)
    // socket.on('rtk_status', (data) => ...)
    return this.generateMockTelemetry();
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
