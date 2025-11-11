-- ==========================================
-- Fix affiliates table structure
-- Add missing required columns
-- ==========================================

-- Check current structure first
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'affiliates'
ORDER BY ordinal_position;

-- Add missing columns (run this if columns are missing)

-- 1. email column
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Make email unique and not null (only if it doesn't have data yet)
-- If there's existing data, you might need to populate email first

-- 3. referral_code column
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- 4. password_hash column
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 5. commission_rate column
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00;

-- 6. status column
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 7. name column
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS name TEXT;

-- 8. commission tracking columns
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS total_commission DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS settled_commission DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS unsettled_commission DECIMAL(10, 2) DEFAULT 0;

-- 9. timestamp columns
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON public.affiliates(referral_code);

-- Verify the result
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'affiliates'
ORDER BY ordinal_position;

