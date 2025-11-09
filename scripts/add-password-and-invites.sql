-- =====================================================
-- 添加密码和邀请码系统
-- 在 Supabase SQL 编辑器中运行此脚本
-- =====================================================

-- 1. 给 affiliates 表添加密码字段
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. 创建邀请码表
CREATE TABLE IF NOT EXISTS public.affiliate_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by TEXT, -- 创建者（管理员）
  max_uses INTEGER DEFAULT 1, -- 最大使用次数
  used_count INTEGER DEFAULT 0, -- 已使用次数
  status TEXT NOT NULL DEFAULT 'active', -- active, used, expired
  expires_at TIMESTAMP WITH TIME ZONE, -- 过期时间（可选）
  used_by_affiliate_id UUID REFERENCES public.affiliates(id), -- 使用者ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.affiliate_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON public.affiliate_invite_codes(status);

-- 4. 插入一些测试邀请码
INSERT INTO public.affiliate_invite_codes (code, created_by, max_uses, status)
VALUES 
  ('WELCOME2025', 'admin', 10, 'active'),
  ('LAUNCH50', 'admin', 50, 'active'),
  ('TESTCODE', 'admin', 1, 'active')
ON CONFLICT (code) DO NOTHING;

-- 5. 为现有的测试分销商添加密码（密码：Test123!）
-- 密码哈希对应的明文密码是: Test123!
DO $$
BEGIN
  -- 确保 pgcrypto 扩展已启用
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  -- 更新测试账号的密码
  UPDATE public.affiliates 
  SET password_hash = crypt('Test123!', gen_salt('bf', 10))
  WHERE email IN ('influencer@test.com', 'marketer@test.com');
END $$;

-- 6. 验证
SELECT 
  'affiliates' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'affiliates' AND column_name = 'password_hash'
UNION ALL
SELECT 
  'invite_codes' as table_name,
  'table_created' as column_name,
  'success' as data_type
FROM public.affiliate_invite_codes 
LIMIT 1;

-- 查看创建的邀请码
SELECT 
  code,
  max_uses,
  used_count,
  status,
  created_at,
  '✅ 邀请码已创建' as message
FROM public.affiliate_invite_codes;

-- =====================================================
-- 完成！
-- 
-- 测试邀请码：
--   - WELCOME2025 (可用10次)
--   - LAUNCH50 (可用50次)
--   - TESTCODE (可用1次)
--
-- 测试账号密码：Test123!
-- =====================================================

