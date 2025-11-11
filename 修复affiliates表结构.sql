-- ==========================================
-- 修复 affiliates 表结构
-- 添加缺失的必要字段
-- ==========================================

-- 1. 添加 email 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN email TEXT UNIQUE NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates(email);
  END IF;
END $$;

-- 2. 添加 name 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN name TEXT;
  END IF;
END $$;

-- 3. 添加 referral_code 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN referral_code TEXT UNIQUE NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON public.affiliates(referral_code);
  END IF;
END $$;

-- 4. 添加 password_hash 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- 5. 添加 commission_rate 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN commission_rate DECIMAL(5, 2) DEFAULT 10.00;
  END IF;
END $$;

-- 6. 添加 status 列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- 7. 添加时间戳列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 8. 添加佣金相关列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'total_commission'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN total_commission DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'settled_commission'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN settled_commission DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates' 
    AND column_name = 'unsettled_commission'
  ) THEN
    ALTER TABLE public.affiliates ADD COLUMN unsettled_commission DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- 9. 验证表结构
SELECT 
  column_name as "列名",
  data_type as "数据类型",
  is_nullable as "可为空",
  column_default as "默认值"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'affiliates'
ORDER BY ordinal_position;

