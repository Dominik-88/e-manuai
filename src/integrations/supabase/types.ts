export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      arealy: {
        Row: {
          created_at: string
          google_maps_link: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          kategorie_travnate_plochy: string | null
          nazev: string
          obvod_oploceni_m: number | null
          okres: Database["public"]["Enums"]["okres_code"] | null
          plocha_m2: number | null
          poznamky: string | null
          prirazeny_stroj_id: string | null
          typ: Database["public"]["Enums"]["typ_arealu"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          google_maps_link?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          kategorie_travnate_plochy?: string | null
          nazev: string
          obvod_oploceni_m?: number | null
          okres?: Database["public"]["Enums"]["okres_code"] | null
          plocha_m2?: number | null
          poznamky?: string | null
          prirazeny_stroj_id?: string | null
          typ?: Database["public"]["Enums"]["typ_arealu"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          google_maps_link?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          kategorie_travnate_plochy?: string | null
          nazev?: string
          obvod_oploceni_m?: number | null
          okres?: Database["public"]["Enums"]["okres_code"] | null
          plocha_m2?: number | null
          poznamky?: string | null
          prirazeny_stroj_id?: string | null
          typ?: Database["public"]["Enums"]["typ_arealu"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arealy_prirazeny_stroj_id_fkey"
            columns: ["prirazeny_stroj_id"]
            isOneToOne: false
            referencedRelation: "stroje"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          created_at: string
          id: string
          nova_data: Json | null
          poznamka: string | null
          puvodni_data: Json | null
          tabulka: string
          typ_zmeny: Database["public"]["Enums"]["typ_zmeny"]
          user_id: string | null
          zaznam_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nova_data?: Json | null
          poznamka?: string | null
          puvodni_data?: Json | null
          tabulka: string
          typ_zmeny: Database["public"]["Enums"]["typ_zmeny"]
          user_id?: string | null
          zaznam_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nova_data?: Json | null
          poznamka?: string | null
          puvodni_data?: Json | null
          tabulka?: string
          typ_zmeny?: Database["public"]["Enums"]["typ_zmeny"]
          user_id?: string | null
          zaznam_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provozni_zaznamy: {
        Row: {
          areal_id: string | null
          created_at: string
          datum_cas_konec: string | null
          datum_cas_start: string
          gps_trasa: string | null
          id: string
          mth_delta: number | null
          mth_konec: number | null
          mth_start: number
          plocha_obdelana_m2: number | null
          poznamky: string | null
          rezim: Database["public"]["Enums"]["provozni_rezim"]
          rtk_stav: Database["public"]["Enums"]["rtk_stav"]
          s_mode: number | null
          stroj_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          areal_id?: string | null
          created_at?: string
          datum_cas_konec?: string | null
          datum_cas_start: string
          gps_trasa?: string | null
          id?: string
          mth_delta?: number | null
          mth_konec?: number | null
          mth_start: number
          plocha_obdelana_m2?: number | null
          poznamky?: string | null
          rezim?: Database["public"]["Enums"]["provozni_rezim"]
          rtk_stav?: Database["public"]["Enums"]["rtk_stav"]
          s_mode?: number | null
          stroj_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          areal_id?: string | null
          created_at?: string
          datum_cas_konec?: string | null
          datum_cas_start?: string
          gps_trasa?: string | null
          id?: string
          mth_delta?: number | null
          mth_konec?: number | null
          mth_start?: number
          plocha_obdelana_m2?: number | null
          poznamky?: string | null
          rezim?: Database["public"]["Enums"]["provozni_rezim"]
          rtk_stav?: Database["public"]["Enums"]["rtk_stav"]
          s_mode?: number | null
          stroj_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provozni_zaznamy_areal_id_fkey"
            columns: ["areal_id"]
            isOneToOne: false
            referencedRelation: "arealy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provozni_zaznamy_stroj_id_fkey"
            columns: ["stroj_id"]
            isOneToOne: false
            referencedRelation: "stroje"
            referencedColumns: ["id"]
          },
        ]
      }
      seceni_relace: {
        Row: {
          areal_id: string | null
          created_at: string
          datum_cas_konec: string | null
          datum_cas_start: string
          id: string
          mth_delta: number | null
          mth_konec: number | null
          mth_start: number
          plocha_posekana_m2: number | null
          poznamky: string | null
          prumerna_rychlost_kmh: number | null
          rezim: string
          rtk_fix_ratio: number | null
          s_mode: number | null
          spotreba_l: number | null
          stroj_id: string
          trajektorie_geojson: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          areal_id?: string | null
          created_at?: string
          datum_cas_konec?: string | null
          datum_cas_start?: string
          id?: string
          mth_delta?: number | null
          mth_konec?: number | null
          mth_start: number
          plocha_posekana_m2?: number | null
          poznamky?: string | null
          prumerna_rychlost_kmh?: number | null
          rezim?: string
          rtk_fix_ratio?: number | null
          s_mode?: number | null
          spotreba_l?: number | null
          stroj_id: string
          trajektorie_geojson?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          areal_id?: string | null
          created_at?: string
          datum_cas_konec?: string | null
          datum_cas_start?: string
          id?: string
          mth_delta?: number | null
          mth_konec?: number | null
          mth_start?: number
          plocha_posekana_m2?: number | null
          poznamky?: string | null
          prumerna_rychlost_kmh?: number | null
          rezim?: string
          rtk_fix_ratio?: number | null
          s_mode?: number | null
          spotreba_l?: number | null
          stroj_id?: string
          trajektorie_geojson?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seceni_relace_areal_id_fkey"
            columns: ["areal_id"]
            isOneToOne: false
            referencedRelation: "arealy"
            referencedColumns: ["id"]
          },
        ]
      }
      servisni_intervaly: {
        Row: {
          created_at: string
          duvod_zmeny_intervalu: string | null
          id: string
          interval_mth: number
          kriticnost: Database["public"]["Enums"]["kriticnost"]
          nazev: string
          popis: string | null
          posledni_zmena_intervalu: string | null
          prvni_servis_mth: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duvod_zmeny_intervalu?: string | null
          id?: string
          interval_mth: number
          kriticnost?: Database["public"]["Enums"]["kriticnost"]
          nazev: string
          popis?: string | null
          posledni_zmena_intervalu?: string | null
          prvni_servis_mth?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duvod_zmeny_intervalu?: string | null
          id?: string
          interval_mth?: number
          kriticnost?: Database["public"]["Enums"]["kriticnost"]
          nazev?: string
          popis?: string | null
          posledni_zmena_intervalu?: string | null
          prvni_servis_mth?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      servisni_zaznamy: {
        Row: {
          areal_id: string | null
          created_at: string
          datum_servisu: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          id: string
          is_deleted: boolean
          mth_pri_servisu: number
          naklady: number | null
          popis: string
          provedl_osoba: string
          provedla_firma: string | null
          servisni_interval_id: string | null
          stroj_id: string
          typ_zasahu: Database["public"]["Enums"]["typ_zasahu"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          areal_id?: string | null
          created_at?: string
          datum_servisu: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          is_deleted?: boolean
          mth_pri_servisu: number
          naklady?: number | null
          popis: string
          provedl_osoba: string
          provedla_firma?: string | null
          servisni_interval_id?: string | null
          stroj_id: string
          typ_zasahu: Database["public"]["Enums"]["typ_zasahu"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          areal_id?: string | null
          created_at?: string
          datum_servisu?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          is_deleted?: boolean
          mth_pri_servisu?: number
          naklady?: number | null
          popis?: string
          provedl_osoba?: string
          provedla_firma?: string | null
          servisni_interval_id?: string | null
          stroj_id?: string
          typ_zasahu?: Database["public"]["Enums"]["typ_zasahu"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servisni_zaznamy_areal_id_fkey"
            columns: ["areal_id"]
            isOneToOne: false
            referencedRelation: "arealy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servisni_zaznamy_servisni_interval_id_fkey"
            columns: ["servisni_interval_id"]
            isOneToOne: false
            referencedRelation: "servisni_intervaly"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servisni_zaznamy_stroj_id_fkey"
            columns: ["stroj_id"]
            isOneToOne: false
            referencedRelation: "stroje"
            referencedColumns: ["id"]
          },
        ]
      }
      stroje: {
        Row: {
          aktualni_mth: number
          compass_servo_drive_version: string | null
          created_at: string
          dashboard_url: string | null
          datum_posledni_aktualizace_mth: string | null
          datum_vyroby: string | null
          gnss_modul: string | null
          id: string
          model: string
          palivo: string
          poznamky: string | null
          procesor: string | null
          ram_gb: number | null
          sirka_zaberu_cm: number
          stav: Database["public"]["Enums"]["stav_stroje"]
          updated_at: string
          vyrobni_cislo: string
        }
        Insert: {
          aktualni_mth?: number
          compass_servo_drive_version?: string | null
          created_at?: string
          dashboard_url?: string | null
          datum_posledni_aktualizace_mth?: string | null
          datum_vyroby?: string | null
          gnss_modul?: string | null
          id?: string
          model?: string
          palivo?: string
          poznamky?: string | null
          procesor?: string | null
          ram_gb?: number | null
          sirka_zaberu_cm?: number
          stav?: Database["public"]["Enums"]["stav_stroje"]
          updated_at?: string
          vyrobni_cislo: string
        }
        Update: {
          aktualni_mth?: number
          compass_servo_drive_version?: string | null
          created_at?: string
          dashboard_url?: string | null
          datum_posledni_aktualizace_mth?: string | null
          datum_vyroby?: string | null
          gnss_modul?: string | null
          id?: string
          model?: string
          palivo?: string
          poznamky?: string | null
          procesor?: string | null
          ram_gb?: number | null
          sirka_zaberu_cm?: number
          stav?: Database["public"]["Enums"]["stav_stroje"]
          updated_at?: string
          vyrobni_cislo?: string
        }
        Relationships: []
      }
      telemetrie_stroje: {
        Row: {
          battery_level: number | null
          created_at: string
          hdop: number | null
          id: string
          latitude: number | null
          longitude: number | null
          mode: string
          mth: number
          rtk_status: string
          s_mode: number | null
          speed: number
          stroj_id: string
          updated_at: string
        }
        Insert: {
          battery_level?: number | null
          created_at?: string
          hdop?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          mode?: string
          mth?: number
          rtk_status?: string
          s_mode?: number | null
          speed?: number
          stroj_id: string
          updated_at?: string
        }
        Update: {
          battery_level?: number | null
          created_at?: string
          hdop?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          mode?: string
          mth?: number
          rtk_status?: string
          s_mode?: number | null
          speed?: number
          stroj_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetrie_stroje_stroj_id_fkey"
            columns: ["stroj_id"]
            isOneToOne: true
            referencedRelation: "stroje"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_audit_log: {
        Args: {
          _nova_data?: Json
          _poznamka?: string
          _puvodni_data?: Json
          _tabulka: string
          _typ_zmeny: Database["public"]["Enums"]["typ_zmeny"]
          _zaznam_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "technik" | "operator"
      kriticnost: "normální" | "důležité" | "kritické"
      okres_code: "PI" | "ST" | "CB" | "PT" | "CK" | "TA"
      provozni_rezim: "manuální" | "poloautonomní" | "autonomní"
      rtk_stav: "FIX" | "FLOAT" | "NONE" | "neznámý"
      stav_stroje: "aktivní" | "v_servisu" | "vyřazeno"
      typ_arealu:
        | "vinice"
        | "sad"
        | "park"
        | "zahrada"
        | "vodojem"
        | "jiné"
        | "úpravna vody"
        | "čerpací stanice"
        | "vrt"
      typ_zasahu: "preventivní" | "oprava" | "porucha" | "jiné"
      typ_zmeny: "vytvoření" | "editace" | "smazání"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "technik", "operator"],
      kriticnost: ["normální", "důležité", "kritické"],
      okres_code: ["PI", "ST", "CB", "PT", "CK", "TA"],
      provozni_rezim: ["manuální", "poloautonomní", "autonomní"],
      rtk_stav: ["FIX", "FLOAT", "NONE", "neznámý"],
      stav_stroje: ["aktivní", "v_servisu", "vyřazeno"],
      typ_arealu: [
        "vinice",
        "sad",
        "park",
        "zahrada",
        "vodojem",
        "jiné",
        "úpravna vody",
        "čerpací stanice",
        "vrt",
      ],
      typ_zasahu: ["preventivní", "oprava", "porucha", "jiné"],
      typ_zmeny: ["vytvoření", "editace", "smazání"],
    },
  },
} as const
