-- ==========================================
-- 完整数据库初始化脚本
-- 执行此脚本将创建所有必要的表、触发器和测试数据
-- ==========================================

-- 1. 创建邀请码表
CREATE TABLE IF NOT EXISTS public.affiliate_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by TEXT,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  used_by_affiliate_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.affiliate_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON public.affiliate_invite_codes(status);

-- 2. 插入初始邀请码
DELETE FROM public.affiliate_invite_codes WHERE code IN ('WELCOME2025', 'LAUNCH50', 'TESTCODE');

INSERT INTO public.affiliate_invite_codes (code, created_by, max_uses, status)
VALUES
  ('WELCOME2025', 'admin', 100, 'active'),
  ('LAUNCH50', 'admin', 500, 'active'),
  ('TESTCODE', 'admin', 10, 'active');

-- 3. 确保 affiliates 表有 password_hash 列
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

-- 4. 验证所有关键表存在
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
    THEN '✅ users 表存在' 
    ELSE '❌ users 表不存在' 
  END as users_table,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliates') 
    THEN '✅ affiliates 表存在' 
    ELSE '❌ affiliates 表不存在' 
  END as affiliates_table,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') 
    THEN '✅ orders 表存在' 
    ELSE '❌ orders 表不存在' 
  END as orders_table,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commissions') 
    THEN '✅ commissions 表存在' 
    ELSE '❌ commissions 表不存在' 
  END as commissions_table,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_invite_codes') 
    THEN '✅ affiliate_invite_codes 表存在' 
    ELSE '❌ affiliate_invite_codes 表不存在' 
  END as invite_codes_table;

-- 5. 查看创建的邀请码
SELECT 
  code as "邀请码",
  max_uses as "最大使用次数",
  used_count as "已使用次数",
  status as "状态",
  created_at as "创建时间"
FROM public.affiliate_invite_codes
ORDER BY created_at DESC;

-- 6. 显示系统统计
SELECT 
  (SELECT COUNT(*) FROM public.users) as "用户总数",
  (SELECT COUNT(*) FROM public.affiliates) as "分销商总数",
  (SELECT COUNT(*) FROM public.orders) as "订单总数",
  (SELECT COALESCE(SUM(amount), 0) FROM public.orders WHERE status = 'completed') as "总收入",
  (SELECT COUNT(*) FROM public.commissions) as "佣金记录数",
  (SELECT COALESCE(SUM(amount), 0) FROM public.commissions WHERE status = 'pending') as "待结算佣金";

