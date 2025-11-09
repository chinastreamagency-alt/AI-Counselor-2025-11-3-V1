-- =====================================================
-- 创建管理员账号 SQL 脚本
-- 在 Supabase SQL 编辑器中运行此脚本
-- =====================================================

-- 1. 启用 pgcrypto 扩展（用于密码加密）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. 确保 admin_users 表存在
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 插入或更新管理员账号
-- 用户名: admin_secure_2025
-- 密码: P@ssw0rd!Sec7ure#2025
-- 邮箱: admin@ai-counselor.com

INSERT INTO public.admin_users (username, email, password_hash, role)
VALUES (
  'admin_secure_2025',
  'admin@ai-counselor.com',
  crypt('P@ssw0rd!Sec7ure#2025', gen_salt('bf', 10)),
  'admin'
)
ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = crypt('P@ssw0rd!Sec7ure#2025', gen_salt('bf', 10)),
  updated_at = NOW();

-- 4. 验证创建成功
SELECT 
  id,
  username,
  email,
  role,
  created_at,
  '✅ 管理员账号已创建/更新' as status
FROM public.admin_users 
WHERE username = 'admin_secure_2025';

-- =====================================================
-- 完成！
-- 登录信息：
--   用户名: admin_secure_2025
--   密码: P@ssw0rd!Sec7ure#2025
--   登录地址: https://your-domain.vercel.app/ad7m2in9/login
-- =====================================================

