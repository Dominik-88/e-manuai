// Sun-Glare mode: Switches to extreme high-contrast when ambient light is high
// Also provides haptic feedback utilities for critical states

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'emanuai-sun-glare';
const LIGHT_THRESHOLD = 30000; // lux threshold for auto-switch

export function useSunGlare() {
  const [isGlareMode, setIsGlareMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [ambientLux, setAmbientLux] = useState<number | null>(null);

  // Apply/remove the class
  useEffect(() => {
    const root = document.documentElement;
    if (isGlareMode) {
      root.classList.add('sun-glare');
    } else {
      root.classList.remove('sun-glare');
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(isGlareMode));
    } catch {}
  }, [isGlareMode]);

  // AmbientLightSensor (Chrome 79+, requires permissions)
  useEffect(() => {
    if (!autoEnabled) return;
    if (!('AmbientLightSensor' in window)) return;

    try {
      const sensor = new (window as any).AmbientLightSensor();
      sensor.addEventListener('reading', () => {
        const lux = sensor.illuminance;
        setAmbientLux(lux);
        if (lux > LIGHT_THRESHOLD && !isGlareMode) {
          setIsGlareMode(true);
        } else if (lux < LIGHT_THRESHOLD * 0.5 && isGlareMode) {
          setIsGlareMode(false);
        }
      });
      sensor.start();
      return () => sensor.stop();
    } catch {
      // Sensor not available
    }
  }, [autoEnabled, isGlareMode]);

  const toggle = useCallback(() => setIsGlareMode(prev => !prev), []);
  const toggleAuto = useCallback(() => setAutoEnabled(prev => !prev), []);

  return { isGlareMode, toggle, autoEnabled, toggleAuto, ambientLux };
}

// Haptic feedback patterns for different alert levels
export function hapticFeedback(level: 'ok' | 'warning' | 'critical' | 'emergency') {
  if (!('vibrate' in navigator)) return;

  switch (level) {
    case 'ok':
      navigator.vibrate(50);
      break;
    case 'warning':
      navigator.vibrate([150, 80, 150]);
      break;
    case 'critical':
      navigator.vibrate([200, 100, 200, 100, 200]);
      break;
    case 'emergency':
      navigator.vibrate([500, 200, 500, 200, 500]);
      break;
  }
}
