import { useState, useEffect } from 'react';
import { getPendingCount, syncPendingRecords } from '@/lib/offline-queue';
import { useOnlineStatus } from './useOnlineStatus';

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(getPendingCount());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPendingCount(typeof detail === 'number' ? detail : getPendingCount());
    };

    window.addEventListener('pending-sync-change', handler);
    window.addEventListener('sync-complete', handler);
    
    return () => {
      window.removeEventListener('pending-sync-change', handler);
      window.removeEventListener('sync-complete', handler);
    };
  }, []);

  const manualSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      await syncPendingRecords();
      setPendingCount(getPendingCount());
    } finally {
      setSyncing(false);
    }
  };

  return { pendingCount, syncing, manualSync, isOnline };
}
