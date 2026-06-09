
ALTER TABLE public.insights
  ADD COLUMN IF NOT EXISTS materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS circular_economy_score numeric,
  ADD COLUMN IF NOT EXISTS landfill_diversion_score numeric,
  ADD COLUMN IF NOT EXISTS recoverable_value_zar numeric,
  ADD COLUMN IF NOT EXISTS equivalences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS highlight text;
