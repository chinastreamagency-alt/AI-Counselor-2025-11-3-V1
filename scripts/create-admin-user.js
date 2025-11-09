/**
 * 创建管理员用户脚本
 * 运行此脚本在 Supabase 数据库中创建管理员账号
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

// 管理员信息（从 .admin-config.json）
const ADMIN_CONFIG = {
  username: 'admin_secure_2025',
  password: 'P@ssw0rd!Sec7ure#2025',
  email: 'admin@ai-counselor.com',
  role: 'admin'
};

async function createAdminUser() {
  try {
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ 错误：缺少 Supabase 环境变量');
      console.log('请确保 .env 文件中包含：');
      console.log('  - NEXT_PUBLIC_SUPABASE_URL');
      console.log('  - SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    console.log('🔐 正在创建管理员账号...\n');

    // 创建 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 生成密码哈希
    console.log('⏳ 正在加密密码...');
    const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, 10);
    console.log('✅ 密码加密完成\n');

    // 检查用户是否已存在
    console.log('🔍 检查管理员是否已存在...');
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', ADMIN_CONFIG.username)
      .single();

    if (existingAdmin) {
      console.log('⚠️  管理员账号已存在！');
      console.log('\n如需更新密码，请手动删除旧记录或使用不同的用户名。\n');
      return;
    }

    // 插入管理员记录
    console.log('📝 正在创建管理员记录...');
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: ADMIN_CONFIG.username,
        email: ADMIN_CONFIG.email,
        password_hash: passwordHash,
        role: ADMIN_CONFIG.role
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 创建失败:', error.message);
      process.exit(1);
    }

    console.log('✅ 管理员账号创建成功！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理员登录信息：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 用户名: ${ADMIN_CONFIG.username}`);
    console.log(`🔑 密码:   ${ADMIN_CONFIG.password}`);
    console.log(`📧 邮箱:   ${ADMIN_CONFIG.email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 登录地址: https://your-domain.vercel.app/ad7m2in9/login\n');
    console.log('⚠️  请妥善保管这些信息！\n');

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    process.exit(1);
  }
}

// 运行脚本
createAdminUser();

