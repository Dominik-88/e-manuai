
-- Fix 1: Remove the overly broad INSERT policy on audit_log
-- Audit entries should only be created by triggers/SECURITY DEFINER functions
DROP POLICY IF EXISTS "Users can insert to audit_log" ON public.audit_log;

-- Create a SECURITY DEFINER function for audit logging instead
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  _tabulka text,
  _zaznam_id uuid,
  _typ_zmeny typ_zmeny,
  _puvodni_data jsonb DEFAULT NULL,
  _nova_data jsonb DEFAULT NULL,
  _poznamka text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (tabulka, zaznam_id, typ_zmeny, puvodni_data, nova_data, user_id, poznamka)
  VALUES (_tabulka, _zaznam_id, _typ_zmeny, _puvodni_data, _nova_data, auth.uid(), _poznamka);
END;
$$;

-- Fix 2: Add DELETE policy on provozni_zaznamy for owners and admin/technik
CREATE POLICY "Owner and admin/technik can delete provozni_zaznamy"
ON public.provozni_zaznamy
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'technik'::app_role)
);
