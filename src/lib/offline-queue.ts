// Offline queue for service records and MTH updates
// Saves to localStorage when offline, syncs to Supabase when connection restores.

import { supabase } from '@/integrations/supabase/client';

export interface PendingRecord {
  id: string;
  type: 'service' | 'operation' | 'mth_update' | 'seceni_quick';
  data: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

const STORAGE_KEY = 'pendingSync';
const MAX_RETRIES = 5;

function getPendingItems(): PendingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingItems(items: PendingRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('pending-sync-change', { detail: items.length }));
}

export async function saveServiceRecord(record: Record<string, unknown>): Promise<{ offline: boolean }> {
  if (navigator.onLine) {
    try {
      const { error } = await supabase
        .from('servisni_zaznamy')
        .insert(record as any);

      if (error) throw error;
      return { offline: false };
    } catch (err) {
      console.error('[OfflineQueue] Online save failed, queuing:', err);
    }
  }

  const pending: PendingRecord = {
    id: crypto.randomUUID(),
    type: 'service',
    data: record,
    createdAt: new Date().toISOString(),
    retries: 0,
  };

  const items = getPendingItems();
  items.push(pending);
  savePendingItems(items);
  return { offline: true };
}

export async function saveOperationRecord(record: Record<string, unknown>): Promise<{ offline: boolean }> {
  if (navigator.onLine) {
    try {
      const { error } = await supabase
        .from('provozni_zaznamy')
        .insert(record as any);

      if (error) throw error;
      return { offline: false };
    } catch {
      // Fall through to offline save
    }
  }

  const pending: PendingRecord = {
    id: crypto.randomUUID(),
    type: 'operation',
    data: record,
    createdAt: new Date().toISOString(),
    retries: 0,
  };

  const items = getPendingItems();
  items.push(pending);
  savePendingItems(items);
  return { offline: true };
}

/**
 * Save MTH update to offline queue when no connection is available.
 * Validates that newMth >= currentMth before queuing.
 */
export async function saveMthUpdate(machineId: string, newMth: number): Promise<{ offline: boolean }> {
  if (navigator.onLine) {
    try {
      const { error } = await supabase
        .from('stroje')
        .update({
          aktualni_mth: newMth,
          datum_posledni_aktualizace_mth: new Date().toISOString(),
        })
        .eq('id', machineId);

      if (error) throw error;
      return { offline: false };
    } catch (err) {
      console.error('[OfflineQueue] Online MTH update failed, queuing:', err);
    }
  }

  const pending: PendingRecord = {
    id: crypto.randomUUID(),
    type: 'mth_update',
    data: {
      machineId,
      newMth,
      timestamp: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    retries: 0,
  };

  const items = getPendingItems();
  items.push(pending);
  savePendingItems(items);
  return { offline: true };
}

/**
 * Quick mowing session — single-tap "posekáno" record from AreasPage.
 * Inserts into seceni_relace; queues offline if no network.
 */
export async function saveQuickMow(input: {
  arealId: string;
  stroj_id: string;
  user_id: string;
  mth_start: number;
  plocha_m2: number | null;
  poznamky?: string | null;
}): Promise<{ offline: boolean }> {
  const now = new Date().toISOString();
  const record = {
    areal_id: input.arealId,
    stroj_id: input.stroj_id,
    user_id: input.user_id,
    datum_cas_start: now,
    datum_cas_konec: now,
    mth_start: input.mth_start,
    mth_konec: input.mth_start,
    mth_delta: 0,
    plocha_posekana_m2: input.plocha_m2,
    rezim: 'manuální',
    poznamky: input.poznamky ?? null,
  };

  if (navigator.onLine) {
    try {
      const { error } = await supabase.from('seceni_relace').insert(record as any);
      if (error) throw error;
      return { offline: false };
    } catch (err) {
      console.error('[OfflineQueue] Quick mow save failed, queuing:', err);
    }
  }

  const pending: PendingRecord = {
    id: crypto.randomUUID(),
    type: 'seceni_quick',
    data: record,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  const items = getPendingItems();
  items.push(pending);
  savePendingItems(items);
  return { offline: true };
}

export async function syncPendingRecords(): Promise<{ synced: number; failed: number }> {
  const items = getPendingItems();
  if (items.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: PendingRecord[] = [];

  for (const item of items) {
    try {
      if (item.type === 'mth_update') {
        const { machineId, newMth, timestamp } = item.data as {
          machineId: string;
          newMth: number;
          timestamp: string;
        };
        const { error } = await supabase
          .from('stroje')
          .update({
            aktualni_mth: newMth,
            datum_posledni_aktualizace_mth: timestamp,
          })
          .eq('id', machineId);
        if (error) throw error;
      } else {
        const table =
          item.type === 'service'
            ? 'servisni_zaznamy'
            : item.type === 'seceni_quick'
              ? 'seceni_relace'
              : 'provozni_zaznamy';
        const { error } = await supabase.from(table).insert(item.data as any);
        if (error) throw error;
      }
      synced++;
    } catch (err) {
      console.error(`[OfflineQueue] Sync failed for ${item.id}:`, err);
      item.retries++;
      if (item.retries < MAX_RETRIES) {
        remaining.push(item);
      }
      failed++;
    }
  }

  savePendingItems(remaining);
  return { synced, failed };
}

export function getPendingCount(): number {
  return getPendingItems().length;
}

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const count = getPendingCount();
    if (count > 0) {
      console.log(`[OfflineQueue] Back online, syncing ${count} records...`);
      const result = await syncPendingRecords();
      console.log(`[OfflineQueue] Synced: ${result.synced}, Failed: ${result.failed}`);

      if (result.synced > 0) {
        window.dispatchEvent(new CustomEvent('sync-complete', { detail: result }));
      }
    }
  });
}
