import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Check, HardDrive } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getCacheStorageInfo, formatBytes } from '@/lib/pwa';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showStorage?: boolean;
}

export function OfflineIndicator({ className, showStorage = false }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const [pendingSync, setPendingSync] = useState(0);
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number } | null>(null);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    // Check storage info
    if (showStorage) {
      getCacheStorageInfo().then(setStorageInfo);
    }

    // Check for pending items in localStorage (simple implementation)
    const pendingItems = localStorage.getItem('pendingSync');
    if (pendingItems) {
      try {
        const items = JSON.parse(pendingItems);
        setPendingSync(Array.isArray(items) ? items.length : 0);
      } catch {
        setPendingSync(0);
      }
    }
  }, [showStorage]);

  // Show sync success animation when coming back online
  useEffect(() => {
    if (isOnline && pendingSync > 0) {
      setJustSynced(true);
      const timer = setTimeout(() => setJustSynced(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingSync]);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Connection status */}
      <div className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        isOnline 
          ? 'bg-success/20 text-success' 
          : 'bg-destructive/20 text-destructive'
      )}>
        {isOnline ? (
          <>
            <Wifi className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
      </div>

      {/* Sync status */}
      {pendingSync > 0 && (
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          justSynced
            ? 'bg-success/20 text-success'
            : 'bg-warning/20 text-warning'
        )}>
          {justSynced ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sync OK</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden sm:inline">{pendingSync} čeká</span>
            </>
          )}
        </div>
      )}

      {/* Storage info */}
      {showStorage && storageInfo && (
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          <HardDrive className="h-3.5 w-3.5" />
          <span>{formatBytes(storageInfo.used)}</span>
        </div>
      )}
    </div>
  );
}

// Full-width offline banner for page top
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Keep showing for a moment when coming back online
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show && isOnline) return null;

  return (
    <div className={cn(
      'fixed left-0 right-0 top-0 z-[100] py-2 text-center text-sm font-medium transition-colors',
      isOnline 
        ? 'bg-success text-success-foreground'
        : 'bg-warning text-warning-foreground'
    )}>
      {isOnline ? (
        <span className="flex items-center justify-center gap-2">
          <Check className="h-4 w-4" />
          Připojení obnoveno
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Pracujete offline – změny se synchronizují po obnovení připojení
        </span>
      )}
    </div>
  );
}
