-- ========================================
-- 创建分销商点击统计表
-- ========================================

-- 1. 创建点击记录表
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_referral_code ON public.affiliate_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);

-- 3. 添加点击统计字段到 affiliates 表
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;

-- 4. 创建触发器函数：点击时自动更新计数
CREATE OR REPLACE FUNCTION update_affiliate_clicks()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新分销商的总点击数
  UPDATE public.affiliates
  SET total_clicks = total_clicks + 1
  WHERE id = NEW.affiliate_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_affiliate_clicks ON public.affiliate_clicks;
CREATE TRIGGER trigger_update_affiliate_clicks
AFTER INSERT ON public.affiliate_clicks
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_clicks();

-- 6. 初始化现有分销商的点击计数
UPDATE public.affiliates
SET total_clicks = (
  SELECT COUNT(*)
  FROM public.affiliate_clicks
  WHERE affiliate_clicks.affiliate_id = affiliates.id
)
WHERE total_clicks = 0;

-- 7. 验证表结构
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'affiliate_clicks'
ORDER BY ordinal_position;

