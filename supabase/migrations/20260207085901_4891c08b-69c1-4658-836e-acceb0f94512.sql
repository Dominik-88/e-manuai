
-- ============================================================
-- FIX: All RLS policies were RESTRICTIVE (blocks everything).
-- Recreate them as PERMISSIVE (the PostgreSQL default).
-- ============================================================

-- ===================== arealy =====================
DROP POLICY IF EXISTS "Authenticated users can view arealy" ON public.arealy;
DROP POLICY IF EXISTS "Technik and admin can delete arealy" ON public.arealy;
DROP POLICY IF EXISTS "Technik and admin can insert arealy" ON public.arealy;
DROP POLICY IF EXISTS "Technik and admin can update arealy" ON public.arealy;

CREATE POLICY "Authenticated users can view arealy"
  ON public.arealy FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Technik and admin can insert arealy"
  ON public.arealy FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

CREATE POLICY "Technik and admin can update arealy"
  ON public.arealy FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

CREATE POLICY "Technik and admin can delete arealy"
  ON public.arealy FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

-- ===================== audit_log =====================
DROP POLICY IF EXISTS "Admins can view audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Deny delete on audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Deny update on audit_log" ON public.audit_log;

CREATE POLICY "Admins can view audit_log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny delete on audit_log"
  ON public.audit_log FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "Deny update on audit_log"
  ON public.audit_log FOR UPDATE
  TO authenticated
  USING (false);

-- ===================== profiles =====================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===================== provozni_zaznamy =====================
DROP POLICY IF EXISTS "Authenticated users can view provozni_zaznamy" ON public.provozni_zaznamy;
DROP POLICY IF EXISTS "Authenticated users can insert provozni_zaznamy" ON public.provozni_zaznamy;
DROP POLICY IF EXISTS "Users can update own provozni_zaznamy" ON public.provozni_zaznamy;
DROP POLICY IF EXISTS "Owner and admin/technik can delete provozni_zaznamy" ON public.provozni_zaznamy;

CREATE POLICY "Authenticated users can view provozni_zaznamy"
  ON public.provozni_zaznamy FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert provozni_zaznamy"
  ON public.provozni_zaznamy FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own provozni_zaznamy"
  ON public.provozni_zaznamy FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

CREATE POLICY "Owner and admin/technik can delete provozni_zaznamy"
  ON public.provozni_zaznamy FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

-- ===================== seceni_relace =====================
DROP POLICY IF EXISTS "Authenticated users can view seceni_relace" ON public.seceni_relace;
DROP POLICY IF EXISTS "Users can insert own seceni_relace" ON public.seceni_relace;
DROP POLICY IF EXISTS "Owner and admin/technik can update seceni_relace" ON public.seceni_relace;
DROP POLICY IF EXISTS "Owner and admin/technik can delete seceni_relace" ON public.seceni_relace;

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

-- ===================== servisni_intervaly =====================
DROP POLICY IF EXISTS "Authenticated users can view servisni_intervaly" ON public.servisni_intervaly;
DROP POLICY IF EXISTS "Technik and admin can manage servisni_intervaly" ON public.servisni_intervaly;

CREATE POLICY "Authenticated users can view servisni_intervaly"
  ON public.servisni_intervaly FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Technik and admin can manage servisni_intervaly"
  ON public.servisni_intervaly FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

-- ===================== servisni_zaznamy =====================
DROP POLICY IF EXISTS "Authenticated users can view servisni_zaznamy" ON public.servisni_zaznamy;
DROP POLICY IF EXISTS "Authenticated users can insert servisni_zaznamy" ON public.servisni_zaznamy;
DROP POLICY IF EXISTS "Users can update own servisni_zaznamy" ON public.servisni_zaznamy;
DROP POLICY IF EXISTS "Technik and admin can delete servisni_zaznamy" ON public.servisni_zaznamy;

CREATE POLICY "Authenticated users can view servisni_zaznamy"
  ON public.servisni_zaznamy FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can insert servisni_zaznamy"
  ON public.servisni_zaznamy FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own servisni_zaznamy"
  ON public.servisni_zaznamy FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

CREATE POLICY "Technik and admin can delete servisni_zaznamy"
  ON public.servisni_zaznamy FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

-- ===================== stroje =====================
DROP POLICY IF EXISTS "Authenticated users can view stroje" ON public.stroje;
DROP POLICY IF EXISTS "Technik and admin can insert stroje" ON public.stroje;
DROP POLICY IF EXISTS "Technik and admin can update stroje" ON public.stroje;
DROP POLICY IF EXISTS "Admin can delete stroje" ON public.stroje;

CREATE POLICY "Authenticated users can view stroje"
  ON public.stroje FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Technik and admin can insert stroje"
  ON public.stroje FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

CREATE POLICY "Technik and admin can update stroje"
  ON public.stroje FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technik'::app_role));

CREATE POLICY "Admin can delete stroje"
  ON public.stroje FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ===================== user_roles =====================
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
