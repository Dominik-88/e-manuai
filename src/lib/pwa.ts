// PWA utilities for e-ManuAI

function isPreviewOrDevHost(hostname: string): boolean {
  return (
    hostname.includes('lovableproject.com') ||
    hostname.includes('id-preview--') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  );
}

export function shouldEnableServiceWorker(): boolean {
  if (typeof window === 'undefined') return false;
  return !isPreviewOrDevHost(window.location.hostname);
}

export async function unregisterServiceWorkersAndClearCaches() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith('emanuai-'))
          .map((name) => caches.delete(name))
      );
    }

    console.log('[PWA] Service workers unregistered and caches cleared for preview/dev');
  } catch (error) {
    console.error('[PWA] Failed to unregister service workers or clear caches:', error);
  }
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('[PWA] Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update prompt
              console.log('[PWA] New content available, refresh to update');
              window.dispatchEvent(new CustomEvent('pwa-update-available'));
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      throw error;
    }
  }
  return null;
}

export function checkOnlineStatus(): boolean {
  return navigator.onLine;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingSync: number;
  lastSync: Date | null;
}

// Check if app is installable
export function canInstallPWA(): boolean {
  return 'BeforeInstallPromptEvent' in window || 
         (navigator as any).standalone === false;
}

// Request background sync
export async function requestSync(tag: string): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}

// Cache storage info
export async function getCacheStorageInfo(): Promise<{ used: number; quota: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch (error) {
      console.error('[PWA] Storage estimate failed:', error);
      return null;
    }
  }
  return null;
}

// Format bytes to human-readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
