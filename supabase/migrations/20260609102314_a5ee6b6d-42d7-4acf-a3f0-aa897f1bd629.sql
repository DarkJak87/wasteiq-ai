
-- 1) Prevent email tampering on profiles via trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.email := OLD.email;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    NEW.id := OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_email_change ON public.profiles;
CREATE TRIGGER profiles_prevent_email_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_email_change();

-- 2) Restrict subscriptions SELECT to company owners + admins only
DROP POLICY IF EXISTS subs_member_select ON public.subscriptions;
CREATE POLICY subs_owner_select ON public.subscriptions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = subscriptions.company_id AND c.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3) Add UPDATE policy on storage.objects for waste-uploads
DROP POLICY IF EXISTS waste_uploads_member_update ON storage.objects;
CREATE POLICY waste_uploads_member_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'waste-uploads'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
)
WITH CHECK (
  bucket_id = 'waste-uploads'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);
