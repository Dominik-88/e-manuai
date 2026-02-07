-- Make audit_log truly append-only: explicitly deny UPDATE and DELETE for all roles including admin
-- Inserts are handled exclusively via SECURITY DEFINER function insert_audit_log()

CREATE POLICY "Deny update on audit_log"
ON public.audit_log
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny delete on audit_log"
ON public.audit_log
FOR DELETE
TO authenticated
USING (false);
