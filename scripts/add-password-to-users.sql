-- 为 users 表添加 password_hash 字段（如果不存在）
-- 用于支持邮箱密码登录

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 验证字段已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'password_hash';

