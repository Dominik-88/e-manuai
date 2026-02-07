import { useState, useEffect, useCallback } from 'react';
import { getBarbieriClient, type TelemetryData, type ConnectionState } from '@/lib/barbieri-realtime';

export function useBarbieriiClient() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  
  const client = getBarbieriClient();

  useEffect(() => {
    const unsubTelemetry = client.onTelemetry(setTelemetry);
    const unsubConnection = client.onConnectionChange(setConnectionState);

    return () => {
      unsubTelemetry();
      unsubConnection();
    };
  }, [client]);

  const connect = useCallback(() => { client.connect(); }, [client]);
  const disconnect = useCallback(() => client.disconnect(), [client]);
  const emergencyStop = useCallback(() => client.emergencyStop(), [client]);

  return {
    telemetry,
    connectionState,
    isConnected: connectionState === 'connected' || connectionState === 'stale',
    connect,
    disconnect,
    emergencyStop,
    loadRoute: (name: string) => client.loadRoute(name),
    startAutonomous: (sMode: number) => client.startAutonomous(sMode),
  };
}
