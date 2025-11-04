# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 创建新项目或使用现有项目
3. 记录以下信息：
   - Project URL
   - Anon (public) key
   - Service role key

## 2. 创建数据库表

在 Supabase SQL Editor 中运行以下 SQL：

\`\`\`sql
-- 订单表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 联盟营销表
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 佣金表
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id),
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_affiliates_code ON affiliates(code);
CREATE INDEX idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX idx_commissions_status ON commissions(status);
\`\`\`

## 3. 在 Vercel 中配置环境变量

在 Vercel 项目设置中添加：

\`\`\`
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
\`\`\`

## 4. 重新部署

配置完环境变量后，在 Vercel 中点击 "Redeploy" 重新部署项目。

## 5. 测试

访问以下 API 端点测试：
- `/api/admin/orders` - 订单管理
- `/api/admin/stats` - 统计数据
- `/api/admin/affiliates` - 联盟营销管理
