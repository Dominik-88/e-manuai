import L from 'leaflet';

// Color and icon mapping per area type
const TYPE_CONFIG: Record<string, { color: string; emoji: string; label: string }> = {
  'vodojem': { color: '#3b82f6', emoji: '💧', label: 'Vodojem' },
  'úpravna vody': { color: '#06b6d4', emoji: '🔧', label: 'ÚV' },
  'čerpací stanice': { color: '#8b5cf6', emoji: '⛽', label: 'ČS' },
  'vrt': { color: '#a16207', emoji: '🕳️', label: 'Vrt' },
  'vinice': { color: '#7c3aed', emoji: '🍇', label: 'Vinice' },
  'sad': { color: '#dc2626', emoji: '🍎', label: 'Sad' },
  'park': { color: '#16a34a', emoji: '🌳', label: 'Park' },
  'zahrada': { color: '#eab308', emoji: '🌻', label: 'Zahrada' },
  'jiné': { color: '#6b7280', emoji: '📍', label: 'Jiné' },
};

export function getTypeConfig(typ: string) {
  return TYPE_CONFIG[typ] || TYPE_CONFIG['jiné'];
}

export function createAreaIcon(typ: string, isInRoute = false, routeIndex?: number): L.DivIcon {
  const config = getTypeConfig(typ);
  
  const showNumber = isInRoute && routeIndex !== undefined;
  const size = showNumber ? 28 : 24;
  const borderColor = isInRoute ? '#22d3ee' : config.color;
  const glowColor = isInRoute ? 'rgba(34,211,238,0.4)' : `${config.color}44`;
  
  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${config.color};
      border: 2px solid ${borderColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${showNumber ? '11px' : '13px'};
      box-shadow: 0 0 6px ${glowColor}, 0 1px 4px rgba(0,0,0,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      position: relative;
    ">
      ${showNumber 
        ? `<span style="color:white;font-weight:800;font-family:'Roboto Mono',monospace;">${routeIndex! + 1}</span>` 
        : config.emoji
      }
      ${isInRoute ? `<div style="
        position:absolute;
        top:-3px;
        right:-3px;
        width:8px;
        height:8px;
        background:#22d3ee;
        border-radius:50%;
        border:2px solid #0f172a;
      "></div>` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-area-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

// Numbered stop marker for route view
export function createStopIcon(index: number, total: number): L.DivIcon {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const color = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#3b82f6';
  const size = 26;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px ${color}66, 0 1px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      <span style="color:white;font-weight:700;font-size:11px;font-family:'Roboto Mono',monospace;">
        ${index + 1}
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-stop-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}
