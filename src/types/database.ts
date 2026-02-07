// Custom type definitions extending Supabase types

export type AppRole = 'admin' | 'technik' | 'operator';
export type StavStroje = 'aktivní' | 'v_servisu' | 'vyřazeno';
export type TypZasahu = 'preventivní' | 'oprava' | 'porucha' | 'jiné';
export type TypArealu = 'vinice' | 'sad' | 'park' | 'zahrada' | 'vodojem' | 'úpravna vody' | 'čerpací stanice' | 'vrt' | 'jiné';

// Autonomy S-Mode definitions per Barbieri XRot 95 EVO specifications
export type SMode = 1 | 2 | 3 | 4;

// Service interval constants (Hard Rules from technical spec)
export const SERVICE_INTERVALS = {
  OIL_FIRST: 50,      // First oil change after 50 mth (break-in period)
  OIL_REGULAR: 100,   // Regular oil change every 100 mth
  BLADES: 50,         // Blade check every 50 mth
  MAJOR: 500,         // Major service every 500 mth
} as const;

// Dashboard threshold constants
export const SERVICE_THRESHOLDS = {
  OK: 20,       // > 20 mth remaining = OK (green)
  WARNING: 0,   // 1-20 mth remaining = WARNING (orange)
  // <= 0 mth = CRITICAL (red)
} as const;
export type OkresCode = 'PI' | 'ST' | 'CB' | 'PT' | 'CK' | 'TA';
export type ProvozniRezim = 'manuální' | 'poloautonomní' | 'autonomní';
export type RtkStav = 'FIX' | 'FLOAT' | 'NONE' | 'neznámý';
export type Kriticnost = 'normální' | 'důležité' | 'kritické';
export type TypZmeny = 'vytvoření' | 'editace' | 'smazání';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Stroj {
  id: string;
  model: string;
  vyrobni_cislo: string;
  datum_vyroby: string | null;
  aktualni_mth: number;
  datum_posledni_aktualizace_mth: string | null;
  stav: StavStroje;
  sirka_zaberu_cm: number;
  palivo: string;
  gnss_modul: string | null;
  procesor: string | null;
  ram_gb: number | null;
  compass_servo_drive_version: string | null;
  dashboard_url: string | null;
  poznamky: string | null;
  created_at: string;
  updated_at: string;
}

export interface Areal {
  id: string;
  nazev: string;
  typ: TypArealu;
  plocha_m2: number | null;
  obvod_oploceni_m: number | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  google_maps_link: string | null;
  kategorie_travnate_plochy: string | null;
  okres: OkresCode | null;
  prirazeny_stroj_id: string | null;
  poznamky: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServisniInterval {
  id: string;
  nazev: string;
  interval_mth: number;
  prvni_servis_mth: number | null;
  popis: string | null;
  kriticnost: Kriticnost;
  posledni_zmena_intervalu: string | null;
  duvod_zmeny_intervalu: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServisniZaznam {
  id: string;
  stroj_id: string;
  areal_id: string | null;
  servisni_interval_id: string | null;
  datum_servisu: string;
  mth_pri_servisu: number;
  typ_zasahu: TypZasahu;
  popis: string;
  provedl_osoba: string;
  provedla_firma: string | null;
  naklady: number | null;
  is_deleted: boolean;
  deleted_reason: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProvozniZaznam {
  id: string;
  stroj_id: string;
  areal_id: string | null;
  datum_cas_start: string;
  datum_cas_konec: string | null;
  rezim: ProvozniRezim;
  s_mode: number | null;
  mth_start: number;
  mth_konec: number | null;
  mth_delta: number | null;
  plocha_obdelana_m2: number | null;
  rtk_stav: RtkStav;
  gps_trasa: string | null;
  poznamky: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// Digital Twin - Mowing session with trajectory
export interface SeceniRelace {
  id: string;
  stroj_id: string;
  areal_id: string | null;
  user_id: string;
  datum_cas_start: string;
  datum_cas_konec: string | null;
  mth_start: number;
  mth_konec: number | null;
  mth_delta: number | null;
  plocha_posekana_m2: number | null;
  prumerna_rychlost_kmh: number | null;
  rtk_fix_ratio: number | null;
  trajektorie_geojson: string | null;
  rezim: string;
  s_mode: number | null;
  spotreba_l: number | null;
  poznamky: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tabulka: string;
  zaznam_id: string;
  typ_zmeny: TypZmeny;
  puvodni_data: Record<string, unknown> | null;
  nova_data: Record<string, unknown> | null;
  poznamka: string | null;
  user_id: string | null;
  created_at: string;
}

// Helper type for service interval status calculation
export interface ServisniIntervalStatus extends ServisniInterval {
  posledni_servis_mth: number | null;
  posledni_servis_datum: string | null;
  zbyvajici_mth: number;
  dalsi_servis_mth: number;
  stav: 'ok' | 'blizi_se' | 'po_terminu';
}

// Okres display names
export const OKRES_NAMES: Record<OkresCode, string> = {
  PI: 'Písek',
  ST: 'Strakonice',
  CB: 'České Budějovice',
  PT: 'Prachatice',
  CK: 'Český Krumlov',
  TA: 'Tábor',
};

// S-Mode descriptions
export const S_MODE_NAMES: Record<number, string> = {
  1: 'Bod-do-bodu (Point to Point)',
  2: 'Spirála (Spiral Cut)',
  3: 'Obdélník (Rectangle)',
  4: 'Automatické pruhy (95 cm)',
};

// RTK status info
export const RTK_STATUS_INFO: Record<RtkStav, { label: string; color: string; description: string }> = {
  'FIX': { 
    label: 'FIX', 
    color: 'success', 
    description: 'Přesnost 1-3 cm ✓ PRO AUTONOMII' 
  },
  'FLOAT': { 
    label: 'FLOAT', 
    color: 'warning', 
    description: 'Přesnost ~1 m – POUZE MANUÁL' 
  },
  'NONE': { 
    label: 'NONE', 
    color: 'destructive', 
    description: 'Bez korekce – NOUZOVÝ REŽIM' 
  },
  'neznámý': { 
    label: 'Neznámý', 
    color: 'muted', 
    description: 'Stav RTK není k dispozici' 
  },
};
