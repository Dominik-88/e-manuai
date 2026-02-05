-- Fix: Restrict audit_log access to admin users only
DROP POLICY IF EXISTS "Authenticated users can view audit_log" ON public.audit_log;

CREATE POLICY "Admins can view audit_log" ON public.audit_log
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));