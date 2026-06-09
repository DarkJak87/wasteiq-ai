
ALTER FUNCTION public.prevent_profile_email_change() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_email_change() FROM PUBLIC, anon, authenticated;
