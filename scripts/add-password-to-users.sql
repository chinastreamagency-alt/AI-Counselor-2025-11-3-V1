-- 为 users 表添加必要字段以支持邮箱注册登录
-- 确保所有字段都存在

-- 1. 添加 password_hash 字段（如果不存在）
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. 确保 name 字段存在
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name TEXT;

-- 3. 确保 id 字段是 UUID 类型（应该已经是）
-- 如果 users 表还不存在，创建它
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  total_hours DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 确保 email 字段有唯一约束
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- 5. 验证表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

