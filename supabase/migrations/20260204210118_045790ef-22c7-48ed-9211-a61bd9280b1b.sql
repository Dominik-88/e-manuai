-- =====================================================
-- BARBIERI XROT 95 EVO PWA - DATABASE SCHEMA
-- =====================================================

-- 1. Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'technik', 'operator');
CREATE TYPE public.stav_stroje AS ENUM ('aktivní', 'v_servisu', 'vyřazeno');
CREATE TYPE public.typ_zasahu AS ENUM ('preventivní', 'oprava', 'porucha', 'jiné');
CREATE TYPE public.typ_arealu AS ENUM ('vinice', 'sad', 'park', 'zahrada', 'vodojem', 'jiné');
CREATE TYPE public.okres_code AS ENUM ('PI', 'ST', 'CB', 'PT', 'CK', 'TA');
CREATE TYPE public.provozni_rezim AS ENUM ('manuální', 'poloautonomní', 'autonomní');
CREATE TYPE public.rtk_stav AS ENUM ('FIX', 'FLOAT', 'NONE', 'neznámý');
CREATE TYPE public.kriticnost AS ENUM ('normální', 'důležité', 'kritické');
CREATE TYPE public.typ_zmeny AS ENUM ('vytvoření', 'editace', 'smazání');

-- 2. Profiles table (user metadata)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. User roles table (separate for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'operator',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 4. Stroje (machines) table
CREATE TABLE public.stroje (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model TEXT NOT NULL DEFAULT 'Barbieri XRot 95 EVO',
    vyrobni_cislo TEXT NOT NULL,
    datum_vyroby DATE,
    aktualni_mth DECIMAL(10,1) NOT NULL DEFAULT 0,
    datum_posledni_aktualizace_mth TIMESTAMP WITH TIME ZONE DEFAULT now(),
    stav stav_stroje NOT NULL DEFAULT 'aktivní',
    sirka_zaberu_cm INTEGER NOT NULL DEFAULT 95,
    palivo TEXT NOT NULL DEFAULT 'Bezolovnatý benzín 95 oktanů (E10 max)',
    gnss_modul TEXT DEFAULT 'u-blox ZED-F9P',
    procesor TEXT DEFAULT 'Broadcom BCM2837 (ARM Cortex-A53, 1.4 GHz)',
    ram_gb INTEGER DEFAULT 1,
    compass_servo_drive_version TEXT DEFAULT '2.0 (R54)',
    dashboard_url TEXT DEFAULT 'http://192.168.4.1:5000',
    poznamky TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Arealy (locations) table
CREATE TABLE public.arealy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nazev TEXT NOT NULL,
    typ typ_arealu NOT NULL DEFAULT 'vodojem',
    plocha_m2 DECIMAL(12,2),
    obvod_oploceni_m DECIMAL(10,2),
    gps_latitude DECIMAL(10,6),
    gps_longitude DECIMAL(10,6),
    google_maps_link TEXT,
    kategorie_travnate_plochy TEXT,
    okres okres_code,
    prirazeny_stroj_id UUID REFERENCES public.stroje(id) ON DELETE SET NULL,
    poznamky TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Servisni intervaly (service intervals definition)
CREATE TABLE public.servisni_intervaly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nazev TEXT NOT NULL,
    interval_mth INTEGER NOT NULL,
    prvni_servis_mth INTEGER,
    popis TEXT,
    kriticnost kriticnost NOT NULL DEFAULT 'normální',
    posledni_zmena_intervalu TIMESTAMP WITH TIME ZONE,
    duvod_zmeny_intervalu TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Servisni zaznamy (service records)
CREATE TABLE public.servisni_zaznamy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stroj_id UUID REFERENCES public.stroje(id) ON DELETE CASCADE NOT NULL,
    areal_id UUID REFERENCES public.arealy(id) ON DELETE SET NULL,
    servisni_interval_id UUID REFERENCES public.servisni_intervaly(id) ON DELETE SET NULL,
    datum_servisu DATE NOT NULL,
    mth_pri_servisu DECIMAL(10,1) NOT NULL,
    typ_zasahu typ_zasahu NOT NULL,
    popis TEXT NOT NULL CHECK (char_length(popis) >= 10),
    provedl_osoba TEXT NOT NULL,
    provedla_firma TEXT,
    naklady DECIMAL(12,2),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_reason TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Provozni zaznamy (operational records)
CREATE TABLE public.provozni_zaznamy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stroj_id UUID REFERENCES public.stroje(id) ON DELETE CASCADE NOT NULL,
    areal_id UUID REFERENCES public.arealy(id) ON DELETE SET NULL,
    datum_cas_start TIMESTAMP WITH TIME ZONE NOT NULL,
    datum_cas_konec TIMESTAMP WITH TIME ZONE,
    rezim provozni_rezim NOT NULL DEFAULT 'manuální',
    s_mode INTEGER CHECK (s_mode >= 1 AND s_mode <= 4),
    mth_start DECIMAL(10,1) NOT NULL,
    mth_konec DECIMAL(10,1),
    mth_delta DECIMAL(10,1),
    plocha_obdelana_m2 DECIMAL(12,2),
    rtk_stav rtk_stav NOT NULL DEFAULT 'neznámý',
    gps_trasa TEXT,
    poznamky TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Audit log table
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabulka TEXT NOT NULL,
    zaznam_id UUID NOT NULL,
    typ_zmeny typ_zmeny NOT NULL,
    puvodni_data JSONB,
    nova_data JSONB,
    poznamka TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'technik' THEN 2 
      WHEN 'operator' THEN 3 
    END
  LIMIT 1
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stroje_updated_at
    BEFORE UPDATE ON public.stroje
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_arealy_updated_at
    BEFORE UPDATE ON public.arealy
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servisni_intervaly_updated_at
    BEFORE UPDATE ON public.servisni_intervaly
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servisni_zaznamy_updated_at
    BEFORE UPDATE ON public.servisni_zaznamy
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provozni_zaznamy_updated_at
    BEFORE UPDATE ON public.provozni_zaznamy
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    
    -- Assign default operator role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'operator');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stroje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arealy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servisni_intervaly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servisni_zaznamy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provozni_zaznamy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Stroje policies (all authenticated users can read, technik/admin can modify)
CREATE POLICY "Authenticated users can view stroje" ON public.stroje
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Technik and admin can insert stroje" ON public.stroje
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

CREATE POLICY "Technik and admin can update stroje" ON public.stroje
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

CREATE POLICY "Admin can delete stroje" ON public.stroje
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Arealy policies (all authenticated users can read and modify)
CREATE POLICY "Authenticated users can view arealy" ON public.arealy
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert arealy" ON public.arealy
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update arealy" ON public.arealy
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "Technik and admin can delete arealy" ON public.arealy
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

-- Servisni intervaly policies
CREATE POLICY "Authenticated users can view servisni_intervaly" ON public.servisni_intervaly
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Technik and admin can manage servisni_intervaly" ON public.servisni_intervaly
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

-- Servisni zaznamy policies
CREATE POLICY "Authenticated users can view servisni_zaznamy" ON public.servisni_zaznamy
    FOR SELECT TO authenticated
    USING (is_deleted = false);

CREATE POLICY "Authenticated users can insert servisni_zaznamy" ON public.servisni_zaznamy
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own servisni_zaznamy" ON public.servisni_zaznamy
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

CREATE POLICY "Technik and admin can delete servisni_zaznamy" ON public.servisni_zaznamy
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

-- Provozni zaznamy policies
CREATE POLICY "Authenticated users can view provozni_zaznamy" ON public.provozni_zaznamy
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert provozni_zaznamy" ON public.provozni_zaznamy
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own provozni_zaznamy" ON public.provozni_zaznamy
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

-- Audit log policies (read only for all, write only via triggers/functions)
CREATE POLICY "Authenticated users can view audit_log" ON public.audit_log
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "System can insert audit_log" ON public.audit_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- =====================================================
-- SEED DATA: Servisní intervaly
-- =====================================================

INSERT INTO public.servisni_intervaly (nazev, interval_mth, prvni_servis_mth, popis, kriticnost) VALUES
('Výměna oleje', 100, 50, 'Všechny body z 100h intervalu včetně výměny oleje. DŮLEŽITÉ: První výměna po 50 mth!', 'kritické'),
('Kontrola nožů', 50, NULL, 'Kontrola a seřízení nožů, kontrola opotřebení', 'důležité'),
('Velký servis', 500, NULL, 'Kompletní servisní prohlídka včetně diagnostiky elektroniky', 'kritické');

-- =====================================================
-- SEED DATA: Sample stroj
-- =====================================================

INSERT INTO public.stroje (vyrobni_cislo, model, aktualni_mth, stav, poznamky) VALUES
('XRot-001', 'Barbieri XRot 95 EVO', 0, 'aktivní', 'Hlavní stroj pro JVS areály');