DROP POLICY IF EXISTS "Authenticated users can insert meta_ads" ON public.meta_ads;
DROP POLICY IF EXISTS "Authenticated users can update meta_ads" ON public.meta_ads;
DROP POLICY IF EXISTS "Authenticated users can write app_settings" ON public.app_settings;

REVOKE INSERT, UPDATE, DELETE ON public.meta_ads FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.app_settings FROM authenticated;
