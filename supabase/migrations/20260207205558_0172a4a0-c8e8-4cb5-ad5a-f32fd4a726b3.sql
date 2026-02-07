
-- Telemetry table: one row per machine, updated by ingest API
CREATE TABLE public.telemetrie_stroje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stroj_id uuid NOT NULL REFERENCES public.stroje(id) ON DELETE CASCADE,
  rtk_status text NOT NULL DEFAULT 'neznámý',
  speed numeric NOT NULL DEFAULT 0,
  latitude numeric,
  longitude numeric,
  battery_level integer,
  mode text NOT NULL DEFAULT 'idle',
  s_mode integer,
  mth numeric NOT NULL DEFAULT 0,
  hdop numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT telemetrie_stroje_stroj_id_unique UNIQUE (stroj_id)
);

-- RLS
ALTER TABLE public.telemetrie_stroje ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read telemetry"
  ON public.telemetrie_stroje FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can manage telemetry"
  ON public.telemetrie_stroje FOR ALL TO service_role
  USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_telemetrie_stroje_updated_at
  BEFORE UPDATE ON public.telemetrie_stroje
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetrie_stroje;
