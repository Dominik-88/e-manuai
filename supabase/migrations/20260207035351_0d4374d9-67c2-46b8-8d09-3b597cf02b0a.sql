
-- Digital Twin: Mowing sessions with trajectory data
CREATE TABLE public.seceni_relace (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stroj_id uuid NOT NULL,
  areal_id uuid REFERENCES public.arealy(id),
  user_id uuid NOT NULL,
  
  -- Timing
  datum_cas_start timestamptz NOT NULL DEFAULT now(),
  datum_cas_konec timestamptz,
  
  -- MTH tracking
  mth_start numeric NOT NULL,
  mth_konec numeric,
  mth_delta numeric GENERATED ALWAYS AS (mth_konec - mth_start) STORED,
  
  -- Performance metrics
  plocha_posekana_m2 numeric,
  prumerna_rychlost_kmh numeric,
  rtk_fix_ratio numeric, -- percentage of time in RTK FIX (0-100)
  
  -- Trajectory (GeoJSON LineString stored as text)
  trajektorie_geojson text,
  
  -- Operating mode
  rezim text NOT NULL DEFAULT 'manuální',
  s_mode integer,
  
  -- Fuel/consumption
  spotreba_l numeric,
  
  -- Notes
  poznamky text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seceni_relace ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view seceni_relace"
  ON public.seceni_relace FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own seceni_relace"
  ON public.seceni_relace FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner and admin/technik can update seceni_relace"
  ON public.seceni_relace FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

CREATE POLICY "Owner and admin/technik can delete seceni_relace"
  ON public.seceni_relace FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_seceni_relace_updated_at
  BEFORE UPDATE ON public.seceni_relace
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick lookups
CREATE INDEX idx_seceni_relace_areal ON public.seceni_relace(areal_id);
CREATE INDEX idx_seceni_relace_stroj ON public.seceni_relace(stroj_id);
CREATE INDEX idx_seceni_relace_datum ON public.seceni_relace(datum_cas_start DESC);
