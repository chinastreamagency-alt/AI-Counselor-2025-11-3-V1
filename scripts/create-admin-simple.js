/**
 * 简化版管理员创建脚本 - 不需要额外依赖
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 读取 .env.local 文件
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ 找不到 .env.local 文件');
    console.log('请确保项目根目录有 .env.local 文件\n');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });

  return env;
}

// 管理员信息
const ADMIN_CONFIG = {
  username: 'admin_secure_2025',
  password: 'P@ssw0rd!Sec7ure#2025',
  email: 'admin@ai-counselor.com',
  role: 'admin'
};

async function createAdminUser() {
  try {
    console.log('🔐 正在创建管理员账号...\n');

    // 加载环境变量
    const env = loadEnv();
    if (!env) {
      process.exit(1);
    }

    const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('❌ 错误：缺少 Supabase 环境变量');
      console.log('请确保 .env.local 文件中包含：');
      console.log('  - NEXT_PUBLIC_SUPABASE_URL');
      console.log('  - SUPABASE_SERVICE_ROLE_KEY\n');
      process.exit(1);
    }

    // 创建 Supabase 客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      console.log('\n正在更新密码...\n');
      
      // 更新密码
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ 
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('username', ADMIN_CONFIG.username);

      if (updateError) {
        console.error('❌ 更新失败:', updateError.message);
        process.exit(1);
      }

      console.log('✅ 密码已更新！\n');
    } else {
      // 插入新管理员记录
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
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 管理员登录信息：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 用户名: ${ADMIN_CONFIG.username}`);
    console.log(`🔑 密码:   ${ADMIN_CONFIG.password}`);
    console.log(`📧 邮箱:   ${ADMIN_CONFIG.email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 登录地址: https://your-domain.vercel.app/ad7m2in9/login\n');
    console.log('✅ 现在可以使用这些凭据登录后台了！\n');

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error('详细信息:', error);
    process.exit(1);
  }
}

// 运行脚本
createAdminUser();

