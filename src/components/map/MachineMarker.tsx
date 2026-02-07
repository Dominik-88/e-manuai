import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useBarbieriiClient } from '@/hooks/useBarbieriiClient';

const pulsingIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:hsl(217,91%,60%);opacity:0.3;animation:machine-pulse 2s ease-out infinite;"></div>
      <div style="position:absolute;top:6px;left:6px;width:12px;height:12px;border-radius:50%;background:hsl(217,91%,60%);border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>
    </div>
    <style>
      @keyframes machine-pulse {
        0% { transform: scale(1); opacity: 0.4; }
        100% { transform: scale(2.5); opacity: 0; }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function MachineMarker() {
  const { telemetry, isConnected, connectionState } = useBarbieriiClient();

  if (!telemetry?.position || !isConnected) return null;

  const rtkLabel = telemetry.rtkStatus === 'FIX' ? '✅ FIX' 
    : telemetry.rtkStatus === 'FLOAT' ? '⚠️ FLOAT' 
    : telemetry.rtkStatus === 'NONE' ? '❌ NONE' : '—';

  const modeLabels: Record<string, string> = {
    'manual': 'Manuální',
    'semi-auto': 'Poloautonomní', 
    'autonomous': 'Autonomní',
    'idle': 'Nečinný',
  };

  return (
    <Marker position={[telemetry.position.lat, telemetry.position.lng]} icon={pulsingIcon}>
      <Popup minWidth={200} maxWidth={260}>
        <div style={{ fontFamily: 'sans-serif', fontSize: '13px', lineHeight: '1.6' }}>
          <strong style={{ fontSize: '14px' }}>🚜 Barbieri XRot 95</strong><br/>
          <span style={{ opacity: 0.7 }}>RTK: {rtkLabel}</span><br/>
          <span style={{ opacity: 0.7 }}>Rychlost: {telemetry.speed.toFixed(1)} km/h</span><br/>
          <span style={{ opacity: 0.7 }}>Režim: {modeLabels[telemetry.mode] || telemetry.mode}</span><br/>
          <span style={{ opacity: 0.5, fontSize: '11px' }}>
            {telemetry.position.lat.toFixed(5)}°N, {telemetry.position.lng.toFixed(5)}°E
          </span>
        </div>
      </Popup>
    </Marker>
  );
}
