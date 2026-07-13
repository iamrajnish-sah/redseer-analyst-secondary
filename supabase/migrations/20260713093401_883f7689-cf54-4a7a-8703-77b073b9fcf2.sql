-- meta_ads table
CREATE TABLE public.meta_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_archive_id TEXT NOT NULL UNIQUE,
  brand TEXT,
  advertiser_name TEXT,
  page_name TEXT,
  page_id TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  media_type TEXT,
  language TEXT,
  cta TEXT,
  creative_text TEXT,
  headline TEXT,
  description TEXT,
  snapshot_url TEXT,
  status TEXT,
  category TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  raw JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meta_ads_brand ON public.meta_ads (brand);
CREATE INDEX idx_meta_ads_start_date ON public.meta_ads (start_date DESC);
CREATE INDEX idx_meta_ads_status ON public.meta_ads (status);
CREATE INDEX idx_meta_ads_media_type ON public.meta_ads (media_type);
CREATE INDEX idx_meta_ads_category ON public.meta_ads (category);
CREATE INDEX idx_meta_ads_platforms ON public.meta_ads USING GIN (platforms);

GRANT SELECT ON public.meta_ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_ads TO authenticated;
GRANT ALL ON public.meta_ads TO service_role;

ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read meta_ads"
  ON public.meta_ads FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert meta_ads"
  ON public.meta_ads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meta_ads"
  ON public.meta_ads FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

-- app_settings key/value store
CREATE TABLE public.app_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can write app_settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_meta_ads_updated_at
  BEFORE UPDATE ON public.meta_ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed defaults
INSERT INTO public.app_settings (key, value) VALUES
  ('apify_actor_id', 'curious_coder/facebook-ads-library-scraper'),
  ('default_country', 'IN')
ON CONFLICT (key) DO NOTHING;
