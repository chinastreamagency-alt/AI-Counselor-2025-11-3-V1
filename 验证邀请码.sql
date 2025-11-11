-- 验证邀请码表是否存在并查看数据
SELECT 
  code as "邀请码",
  max_uses as "最大使用次数",
  used_count as "已使用",
  status as "状态",
  created_at as "创建时间"
FROM public.affiliate_invite_codes
ORDER BY created_at DESC;

-- 如果上面的查询返回错误 "relation does not exist"
-- 说明表还没有创建，请执行下面的完整初始化脚本：

/*
-- ==========================================
-- 完整初始化脚本
-- ==========================================

-- 启用加密扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 给 affiliates 表添加密码字段
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. 创建邀请码表
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

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.affiliate_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON public.affiliate_invite_codes(status);

-- 4. 插入初始邀请码
INSERT INTO public.affiliate_invite_codes (code, created_by, max_uses, status)
VALUES
  ('WELCOME2025', 'admin', 100, 'active'),
  ('LAUNCH50', 'admin', 500, 'active'),
  ('TESTCODE', 'admin', 10, 'active')
ON CONFLICT (code) DO NOTHING;

-- 5. 验证结果
SELECT code, max_uses, used_count, status, created_at 
FROM public.affiliate_invite_codes;
*/

