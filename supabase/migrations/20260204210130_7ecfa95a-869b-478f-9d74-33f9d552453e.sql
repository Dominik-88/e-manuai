-- Fix overly permissive RLS policies for arealy table
-- Only technik and admin can modify arealy, operators can only read

-- Drop the permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert arealy" ON public.arealy;
DROP POLICY IF EXISTS "Authenticated users can update arealy" ON public.arealy;

-- Create more restrictive policies
CREATE POLICY "Technik and admin can insert arealy" ON public.arealy
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

CREATE POLICY "Technik and admin can update arealy" ON public.arealy
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technik'));

-- Fix audit_log insert policy - should only allow via system/triggers
DROP POLICY IF EXISTS "System can insert audit_log" ON public.audit_log;

CREATE POLICY "Users can insert to audit_log" ON public.audit_log
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);