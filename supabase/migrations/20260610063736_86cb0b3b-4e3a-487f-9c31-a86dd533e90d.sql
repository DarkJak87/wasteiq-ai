ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS confidence_score numeric;
UPDATE public.insights SET confidence_score = 75 WHERE confidence_score IS NULL;