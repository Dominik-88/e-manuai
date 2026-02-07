/**
 * Telemetry Sync Service
 * 
 * Bridge mezi Barbieri API a Supabase databází.
 * Pravidelně stahuje telemetrii z Barbieri API a ukládá do Supabase
 * pro historii, analytics a offline přístup.
 */

import { supabase } from '@/integrations/supabase/client';

const BARBIERI_API_URL = 'http://192.168.4.1:5000';
const SYNC_INTERVAL_MS = 5000; // 5 sekund
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface BarbieriiTelemetry {
  gps: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  rtk: {
    status: 'FIX' | 'FLOAT' | 'NONE';
    accuracy_cm: number;
  };
  motion: {
    speed_kmh: number;
    heading_deg: number;
  };
  power: {
    battery_voltage: number;
    battery_percentage: number;
  };
  diagnostics: {
    engine_temp_c: number;
    oil_pressure_bar: number;
    blade_rpm: number;
  };
  mth: number;
  timestamp: string;
}

export class TelemetrySync {
  private intervalId: NodeJS.Timeout | null = null;
  private strojId: string;
  private isRunning: boolean = false;
  private retryCount: number = 0;
  private lastSuccessfulSync: Date | null = null;
  private errorCallback?: (error: Error) => void;
  private successCallback?: (data: BarbieriiTelemetry) => void;

  constructor(strojId: string) {
    this.strojId = strojId;
  }

  /**
   * Spustí synchronizaci telemetrie
   */
  async start() {
    if (this.isRunning) {
      console.warn('⚠️ Telemetry sync už běží');
      return;
    }

    console.log('🔄 Telemetry sync started for stroj:', this.strojId);
    this.isRunning = true;
    
    // První sync okamžitě
    await this.syncTelemetry();
    
    // Pak každých 5 sekund
    this.intervalId = setInterval(() => {
      this.syncTelemetry();
    }, SYNC_INTERVAL_MS);
  }

  /**
   * Zastaví synchronizaci
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🔄 Telemetry sync stopped');
    }
  }

  /**
   * Nastaví callback pro chyby
   */
  onError(callback: (error: Error) => void) {
    this.errorCallback = callback;
  }

  /**
   * Nastaví callback pro úspěšnou synchronizaci
   */
  onSuccess(callback: (data: BarbieriiTelemetry) => void) {
    this.successCallback = callback;
  }

  /**
   * Vrátí čas poslední úspěšné synchronizace
   */
  getLastSyncTime(): Date | null {
    return this.lastSuccessfulSync;
  }

  /**
   * Je synchronizace aktivní?
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Hlavní synchronizační logika
   */
  private async syncTelemetry() {
    try {
      // 1. Fetch z Barbieri API
      const telemetry = await this.fetchBarbieriiTelemetry();
      
      // 2. Uložit do Supabase
      await this.saveTelemetryToSupabase(telemetry);
      
      // 3. Aktualizovat MTH v tabulce stroje
      await this.updateMachineMetrics(telemetry);
      
      // 4. Reset retry counter
      this.retryCount = 0;
      this.lastSuccessfulSync = new Date();
      
      // 5. Success callback
      if (this.successCallback) {
        this.successCallback(telemetry);
      }
      
      console.log('✅ Telemetry synced:', {
        lat: telemetry.gps.latitude.toFixed(6),
        lng: telemetry.gps.longitude.toFixed(6),
        rtk: telemetry.rtk.status,
        speed: telemetry.motion.speed_kmh.toFixed(1),
        mth: telemetry.mth.toFixed(1)
      });
      
    } catch (error) {
      this.handleSyncError(error as Error);
    }
  }

  /**
   * Stáhne telemetrii z Barbieri API
   */
  private async fetchBarbieriiTelemetry(): Promise<BarbieriiTelemetry> {
    const response = await fetch(`${BARBIERI_API_URL}/api/telemetry`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`Barbieri API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Uloží telemetrii do Supabase
   */
  private async saveTelemetryToSupabase(telemetry: BarbieriiTelemetry) {
    const { error } = await supabase
      .from('telemetrie_log')
      .insert([{
        stroj_id: this.strojId,
        gps_lat: telemetry.gps.latitude,
        gps_lng: telemetry.gps.longitude,
        gps_alt: telemetry.gps.altitude,
        rtk_status: telemetry.rtk.status,
        rtk_accuracy_cm: telemetry.rtk.accuracy_cm,
        speed_kmh: telemetry.motion.speed_kmh,
        heading_deg: telemetry.motion.heading_deg,
        battery_voltage: telemetry.power.battery_voltage,
        battery_percentage: telemetry.power.battery_percentage,
        engine_temp_c: telemetry.diagnostics.engine_temp_c,
        oil_pressure_bar: telemetry.diagnostics.oil_pressure_bar,
        blade_rpm: telemetry.diagnostics.blade_rpm,
        mth: telemetry.mth,
        timestamp: telemetry.timestamp
      }]);

    if (error) {
      // Ignorovat duplicate key errors (může nastat při rychlém polling)
      if (error.code === '23505') {
        console.debug('⚠️ Duplicate telemetry entry, skipping');
        return;
      }
      throw error;
    }
  }

  /**
   * Aktualizuje MTH a další metriky v tabulce stroje
   */
  private async updateMachineMetrics(telemetry: BarbieriiTelemetry) {
    const { error } = await supabase
      .from('stroje')
      .update({ 
        aktualni_mth: Math.floor(telemetry.mth),
        updated_at: new Date().toISOString()
      })
      .eq('id', this.strojId);

    if (error) {
      console.error('❌ Error updating machine metrics:', error);
      // Neházet error - MTH update není kritický
    }
  }

  /**
   * Zpracování chyb s retry logikou
   */
  private async handleSyncError(error: Error) {
    console.error('❌ Telemetry sync error:', error.message);
    
    this.retryCount++;
    
    if (this.retryCount <= MAX_RETRIES) {
      console.log(`🔄 Retry ${this.retryCount}/${MAX_RETRIES} za ${RETRY_DELAY_MS}ms`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      await this.syncTelemetry();
    } else {
      console.error('❌ Max retries reached, giving up');
      this.retryCount = 0;
      
      if (this.errorCallback) {
        this.errorCallback(error);
      }
    }
  }
}

/**
 * Singleton instance pro globální použití
 */
let globalSyncInstance: TelemetrySync | null = null;

export function startGlobalTelemetrySync(strojId: string): TelemetrySync {
  if (globalSyncInstance) {
    globalSyncInstance.stop();
  }
  
  globalSyncInstance = new TelemetrySync(strojId);
  globalSyncInstance.start();
  
  return globalSyncInstance;
}

export function stopGlobalTelemetrySync() {
  if (globalSyncInstance) {
    globalSyncInstance.stop();
    globalSyncInstance = null;
  }
}

export function getGlobalTelemetrySync(): TelemetrySync | null {
  return globalSyncInstance;
}
