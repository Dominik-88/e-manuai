-- =====================================================
-- TELEMETRIE SYSTÉM PRO e-ManuAI
-- Ukládání telemetrie z Barbieri API do Supabase
-- =====================================================

-- 1️⃣ TABULKA PRO TELEMETRICKÝ LOG
CREATE TABLE IF NOT EXISTS public.telemetrie_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stroj_id UUID NOT NULL REFERENCES public.stroje(id) ON DELETE CASCADE,
  
  -- GPS & RTK
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  gps_alt DECIMAL(8, 2),
  rtk_status TEXT CHECK (rtk_status IN ('FIX', 'FLOAT', 'NONE')),
  rtk_accuracy_cm INTEGER,
  
  -- Motion
  speed_kmh DECIMAL(5, 2),
  heading_deg DECIMAL(5, 2),
  
  -- Power
  battery_voltage DECIMAL(5, 2),
  battery_percentage INTEGER CHECK (battery_percentage BETWEEN 0 AND 100),
  
  -- Diagnostics
  engine_temp_c DECIMAL(5, 2),
  oil_pressure_bar DECIMAL(5, 2),
  blade_rpm INTEGER,
  
  -- MTH
  mth DECIMAL(10, 2),
  
  -- Metadata
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_stroj_timestamp UNIQUE (stroj_id, timestamp)
);

-- Indexy pro rychlé dotazy
CREATE INDEX idx_telemetrie_stroj_time ON telemetrie_log(stroj_id, timestamp DESC);
CREATE INDEX idx_telemetrie_recent ON telemetrie_log(created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '24 hours';
CREATE INDEX idx_telemetrie_rtk ON telemetrie_log(rtk_status, stroj_id);

-- 2️⃣ POVOLIT REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE telemetrie_log;

-- 3️⃣ RLS POLICIES
ALTER TABLE public.telemetrie_log ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - všichni mohou číst
CREATE POLICY "Všichni mohou číst telemetrii"
  ON public.telemetrie_log
  FOR SELECT
  USING (true);

-- Policy: INSERT - pouze authenticated users
CREATE POLICY "Authenticated může vkládat telemetrii"
  ON public.telemetrie_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: UPDATE - zakázáno (immutable log)
-- Policy: DELETE - zakázáno (audit trail)

-- 4️⃣ FUNKCE PRO ZÍSKÁNÍ POSLEDNÍ TELEMETRIE
CREATE OR REPLACE FUNCTION get_latest_telemetry(p_stroj_id UUID)
RETURNS TABLE (
  gps_lat DECIMAL,
  gps_lng DECIMAL,
  gps_alt DECIMAL,
  rtk_status TEXT,
  rtk_accuracy_cm INTEGER,
  speed_kmh DECIMAL,
  heading_deg DECIMAL,
  battery_voltage DECIMAL,
  battery_percentage INTEGER,
  engine_temp_c DECIMAL,
  oil_pressure_bar DECIMAL,
  blade_rpm INTEGER,
  mth DECIMAL,
  timestamp TIMESTAMPTZ,
  age_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.gps_lat,
    t.gps_lng,
    t.gps_alt,
    t.rtk_status,
    t.rtk_accuracy_cm,
    t.speed_kmh,
    t.heading_deg,
    t.battery_voltage,
    t.battery_percentage,
    t.engine_temp_c,
    t.oil_pressure_bar,
    t.blade_rpm,
    t.mth,
    t.timestamp,
    EXTRACT(EPOCH FROM (NOW() - t.timestamp))::INTEGER AS age_seconds
  FROM telemetrie_log t
  WHERE t.stroj_id = p_stroj_id
  ORDER BY t.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5️⃣ FUNKCE PRO TELEMETRICKOU HISTORII (trail)
CREATE OR REPLACE FUNCTION get_telemetry_trail(
  p_stroj_id UUID,
  p_hours INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  gps_lat DECIMAL,
  gps_lng DECIMAL,
  rtk_status TEXT,
  speed_kmh DECIMAL,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.gps_lat,
    t.gps_lng,
    t.rtk_status,
    t.speed_kmh,
    t.timestamp
  FROM telemetrie_log t
  WHERE t.stroj_id = p_stroj_id
    AND t.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
  ORDER BY t.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ VIEW PRO AKTUÁLNÍ STAV VŠECH STROJŮ
CREATE OR REPLACE VIEW v_stroje_live_status AS
SELECT 
  s.id,
  s.vyrobni_cislo,
  s.model,
  s.aktualni_mth,
  s.stav,
  t.gps_lat,
  t.gps_lng,
  t.rtk_status,
  t.speed_kmh,
  t.battery_percentage,
  t.timestamp AS last_telemetry,
  EXTRACT(EPOCH FROM (NOW() - t.timestamp))::INTEGER AS seconds_since_last_signal,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - t.timestamp)) < 60 THEN true
    ELSE false
  END AS is_online
FROM stroje s
LEFT JOIN LATERAL (
  SELECT *
  FROM telemetrie_log tl
  WHERE tl.stroj_id = s.id
  ORDER BY tl.timestamp DESC
  LIMIT 1
) t ON true;

-- 7️⃣ AUTOMATICKÉ ČIŠTĚNÍ STARÝCH DAT (retention policy)
-- Uchovávat pouze 30 dní telemetrie
CREATE OR REPLACE FUNCTION cleanup_old_telemetry()
RETURNS void AS $$
BEGIN
  DELETE FROM telemetrie_log
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleaned up telemetry older than 30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Spustit cleanup každý den ve 3:00 ráno (nastavit v Supabase Dashboard)
-- SELECT cron.schedule('cleanup-telemetry', '0 3 * * *', 'SELECT cleanup_old_telemetry()');

-- 8️⃣ KOMENTÁŘE PRO DOKUMENTACI
COMMENT ON TABLE telemetrie_log IS 'Telemetrický log z Barbieri API - GPS, RTK, diagnostika';
COMMENT ON COLUMN telemetrie_log.rtk_status IS 'FIX (1-3cm), FLOAT (~1m), NONE (bez korekce)';
COMMENT ON COLUMN telemetrie_log.mth IS 'Motohodiny v čase záznamu';
COMMENT ON FUNCTION get_latest_telemetry IS 'Vrací poslední telemetrii pro daný stroj';
COMMENT ON FUNCTION get_telemetry_trail IS 'Vrací historii pozic pro zobrazení trasy';
COMMENT ON VIEW v_stroje_live_status IS 'Live status všech strojů s poslední telemetrií';
