-- =====================================================
-- 创建测试分销商账号
-- 在 Supabase SQL 编辑器中运行此脚本
-- =====================================================

-- 测试分销商 1：网红代理
INSERT INTO public.affiliates (
  email,
  name,
  referral_code,
  commission_rate,
  total_commission,
  settled_commission,
  unsettled_commission,
  status
)
VALUES (
  'influencer@test.com',
  'Test Influencer',
  'INFLUENCER2025',
  10.00,
  0,
  0,
  0,
  'active'
)
ON CONFLICT (email) DO UPDATE 
SET updated_at = NOW();

-- 测试分销商 2：营销推广员
INSERT INTO public.affiliates (
  email,
  name,
  referral_code,
  commission_rate,
  total_commission,
  settled_commission,
  unsettled_commission,
  status
)
VALUES (
  'marketer@test.com',
  'Test Marketer',
  'MARKETER2025',
  10.00,
  0,
  0,
  0,
  'active'
)
ON CONFLICT (email) DO UPDATE 
SET updated_at = NOW();

-- 验证创建成功
SELECT 
  id,
  email,
  name,
  referral_code,
  commission_rate,
  status,
  created_at,
  '✅ 测试分销商账号已创建' as status_message
FROM public.affiliates 
WHERE email IN ('influencer@test.com', 'marketer@test.com');

-- =====================================================
-- 测试账号信息：
-- 
-- 账号 1 - 网红代理
--   邮箱: influencer@test.com
--   姓名: Test Influencer
--   推荐码: INFLUENCER2025
--   佣金比例: 10%
--
-- 账号 2 - 营销推广员
--   邮箱: marketer@test.com
--   姓名: Test Marketer
--   推荐码: MARKETER2025
--   佣金比例: 10%
-- =====================================================

