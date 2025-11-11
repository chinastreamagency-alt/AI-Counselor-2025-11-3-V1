-- 创建邀请码表（如果不存在）
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

-- 删除旧的测试邀请码（如果存在）
DELETE FROM public.affiliate_invite_codes WHERE code IN ('WELCOME2025', 'LAUNCH50', 'TESTCODE');

-- 插入新的邀请码
INSERT INTO public.affiliate_invite_codes (code, created_by, max_uses, status)
VALUES
  ('WELCOME2025', 'admin', 100, 'active'),
  ('LAUNCH50', 'admin', 500, 'active'),
  ('TESTCODE', 'admin', 10, 'active');

-- 查看创建的邀请码
SELECT 
  code,
  max_uses,
  used_count,
  status,
  created_at
FROM public.affiliate_invite_codes
ORDER BY created_at DESC;

