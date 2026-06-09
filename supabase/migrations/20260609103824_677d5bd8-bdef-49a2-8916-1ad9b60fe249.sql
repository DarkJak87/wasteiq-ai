
-- Restrict writes on user_roles so authenticated users cannot self-assign roles.
-- Only service_role (used by trusted server code) can modify role assignments.

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;

-- Explicitly deny INSERT/UPDATE/DELETE for any non-service role via RLS.
DROP POLICY IF EXISTS "No client inserts on user_roles" ON public.user_roles;
CREATE POLICY "No client inserts on user_roles"
  ON public.user_roles FOR INSERT TO authenticated, anon
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates on user_roles" ON public.user_roles;
CREATE POLICY "No client updates on user_roles"
  ON public.user_roles FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes on user_roles" ON public.user_roles;
CREATE POLICY "No client deletes on user_roles"
  ON public.user_roles FOR DELETE TO authenticated, anon
  USING (false);
