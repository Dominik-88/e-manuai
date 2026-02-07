-- =====================================================
-- SYSTÉM SERVISNÍCH INTERVALŮ
-- Automatické sledování a upozornění na servis
-- =====================================================

-- 1️⃣ TABULKA PRO DEFINICI INTERVALŮ
CREATE TABLE IF NOT EXISTS public.service_intervals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nazev TEXT NOT NULL,
  interval_mth INTEGER NOT NULL,
  first_service_mth INTEGER, -- Speciální případ (např. olej po 50 mth)
  kriticky BOOLEAN DEFAULT false,
  popis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_service_name UNIQUE (nazev)
);

-- RLS
ALTER TABLE public.service_intervals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Všichni mohou číst intervaly"
  ON public.service_intervals FOR SELECT
  USING (true);

CREATE POLICY "Pouze admin může upravovat intervaly"
  ON public.service_intervals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2️⃣ SEED DATA - Autentické servisní intervaly Barbieri XRot 95 EVO
INSERT INTO public.service_intervals (nazev, interval_mth, first_service_mth, kriticky, popis) VALUES
  ('Výměna motorového oleje', 100, 50, true, 'PRVNÍ výměna po 50 mth, další pak každých 100 mth. Použít SAE 10W-30 nebo 10W-40.'),
  ('Kontrola a údržba nožů', 50, NULL, true, 'Kontrola opotřebení, ostření nebo výměna. Kritické pro kvalitu sekání.'),
  ('Velký servis', 500, NULL, true, 'Kompletní servisní prohlídka včetně diagnostiky všech systémů.'),
  ('Kontrola řemenů', 200, NULL, false, 'Vizuální kontrola a seřízení napnutí řemenů pohonu.'),
  ('Kontrola vzduchového filtru', 100, NULL, false, 'Čištění nebo výměna vzduchového filtru motoru.'),
  ('Mazání ložisek', 100, NULL, false, 'Mazání všech pohyblivých částí a ložisek.'),
  ('Kontrola pneumatik', 50, NULL, false, 'Kontrola tlaku a opotřebení pneumatik.'),
  ('Kontrola RTK antény', 200, NULL, false, 'Kontrola upevnění a čistoty GNSS antény.')
ON CONFLICT (nazev) DO NOTHING;

-- 3️⃣ VIEW PRO PŘEHLED SERVISŮ VŠECH STROJŮ
CREATE OR REPLACE VIEW v_service_status AS
SELECT 
  s.id AS stroj_id,
  s.vyrobni_cislo,
  s.model,
  s.aktualni_mth,
  si.id AS interval_id,
  si.nazev AS service_name,
  si.interval_mth,
  si.first_service_mth,
  si.kriticky,
  si.popis,
  
  -- Kolik servisů tohoto typu už bylo
  (SELECT COUNT(*) 
   FROM servisni_zaznamy sz 
   WHERE sz.stroj_id = s.id 
   AND sz.is_deleted = false
   AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'
  ) AS service_count,
  
  -- Poslední servis tohoto typu
  (SELECT MAX(mth_pri_servisu) 
   FROM servisni_zaznamy sz 
   WHERE sz.stroj_id = s.id 
   AND sz.is_deleted = false
   AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'
  ) AS last_service_mth,
  
  -- Datum posledního servisu
  (SELECT MAX(datum_servisu) 
   FROM servisni_zaznamy sz 
   WHERE sz.stroj_id = s.id 
   AND sz.is_deleted = false
   AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'
  ) AS last_service_date,
  
  -- Další servis
  CASE 
    -- Pokud ještě nebyl žádný servis a existuje first_service_mth
    WHEN (SELECT COUNT(*) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND sz.is_deleted = false AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%') = 0 
      AND si.first_service_mth IS NOT NULL
    THEN si.first_service_mth
    -- Jinak poslední servis + interval
    ELSE COALESCE(
      (SELECT MAX(mth_pri_servisu) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND sz.is_deleted = false AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'),
      0
    ) + si.interval_mth
  END AS next_service_mth,
  
  -- Zbývá do servisu
  CASE 
    WHEN (SELECT COUNT(*) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND sz.is_deleted = false AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%') = 0 
      AND si.first_service_mth IS NOT NULL
    THEN si.first_service_mth - s.aktualni_mth
    ELSE (COALESCE(
      (SELECT MAX(mth_pri_servisu) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND sz.is_deleted = false AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'),
      0
    ) + si.interval_mth) - s.aktualni_mth
  END AS remaining_mth,
  
  -- Je po termínu?
  s.aktualni_mth >= CASE 
    WHEN (SELECT COUNT(*) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND sz.is_deleted = false AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%') = 0 
      AND si.first_service_mth IS NOT NULL
    THEN si.first_service_mth
    ELSE COALESCE(
      (SELECT MAX(mth_pri_servisu) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND sz.is_deleted = false AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'),
      0
    ) + si.interval_mth
  END AS is_overdue,
  
  -- Blíží se servis? (do 10 mth)
  CASE 
    WHEN (SELECT COUNT(*) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND sz.is_deleted = false AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%') = 0 
      AND si.first_service_mth IS NOT NULL
    THEN (si.first_service_mth - s.aktualni_mth) <= 10
    ELSE ((COALESCE(
      (SELECT MAX(mth_pri_servisu) FROM servisni_zaznamy sz WHERE sz.stroj_id = s.id AND sz.is_deleted = false AND LOWER(sz.popis) LIKE '%' || LOWER(si.nazev) || '%'),
      0
    ) + si.interval_mth) - s.aktualni_mth) <= 10
  END AS is_approaching

FROM stroje s
CROSS JOIN service_intervals si
ORDER BY s.id, next_service_mth;

-- 4️⃣ FUNKCE PRO ZÍSKÁNÍ NEJBLIŽŠÍHO SERVISU
CREATE OR REPLACE FUNCTION get_next_service(p_stroj_id UUID)
RETURNS TABLE (
  service_name TEXT,
  next_service_mth INTEGER,
  remaining_mth INTEGER,
  is_overdue BOOLEAN,
  is_critical BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vs.service_name,
    vs.next_service_mth::INTEGER,
    vs.remaining_mth::INTEGER,
    vs.is_overdue,
    vs.kriticky
  FROM v_service_status vs
  WHERE vs.stroj_id = p_stroj_id
    AND vs.kriticky = true
  ORDER BY vs.next_service_mth
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5️⃣ FUNKCE PRO POČET SERVISŮ PO TERMÍNU
CREATE OR REPLACE FUNCTION count_overdue_services(p_stroj_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM v_service_status
  WHERE stroj_id = p_stroj_id
    AND is_overdue = true
    AND kriticky = true;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ KOMENTÁŘE
COMMENT ON TABLE service_intervals IS 'Definice servisních intervalů pro Barbieri XRot 95 EVO';
COMMENT ON VIEW v_service_status IS 'Kompletní přehled servisního stavu všech strojů';
COMMENT ON FUNCTION get_next_service IS 'Vrací nejbližší kritický servis pro daný stroj';
COMMENT ON FUNCTION count_overdue_services IS 'Počet kritických servisů po termínu';
