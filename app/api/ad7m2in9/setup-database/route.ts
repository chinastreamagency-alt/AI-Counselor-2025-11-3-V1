import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log("[Setup] Starting database initialization...")

    // 1. 创建邀请码表
    const { error: createTableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.affiliate_invite_codes(code);
        CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON public.affiliate_codes(status);
      `
    })

    // 如果 rpc 不可用，直接尝试插入数据来测试表是否存在
    // 如果表不存在，会返回错误，我们捕获后手动创建
    
    // 2. 检查表是否存在
    const { error: checkError } = await supabaseAdmin
      .from('affiliate_invite_codes')
      .select('id')
      .limit(1)

    if (checkError && checkError.message.includes('does not exist')) {
      return NextResponse.json({ 
        error: "需要手动创建表",
        message: "请在 Supabase SQL 编辑器中执行初始化脚本",
        needsManualSetup: true
      }, { status: 400 })
    }

    // 3. 确保 affiliates 表有 password_hash 列
    try {
      const { error: addColumnError } = await supabaseAdmin
        .from('affiliates')
        .select('password_hash')
        .limit(1)
      
      if (addColumnError && addColumnError.message.includes('column')) {
        // 列不存在，但我们无法通过 API 添加列
        console.log("[Setup] password_hash column may need to be added manually")
      }
    } catch (err) {
      console.log("[Setup] Column check error:", err)
    }

    // 4. 插入初始邀请码（如果不存在）
    const initialCodes = [
      { code: 'WELCOME2025', created_by: 'system', max_uses: 100, status: 'active' },
      { code: 'LAUNCH50', created_by: 'system', max_uses: 500, status: 'active' },
      { code: 'TESTCODE', created_by: 'system', max_uses: 10, status: 'active' },
    ]

    for (const codeData of initialCodes) {
      const { error: insertError } = await supabaseAdmin
        .from('affiliate_invite_codes')
        .upsert(codeData, { onConflict: 'code', ignoreDuplicates: true })
      
      if (insertError) {
        console.error(`[Setup] Error inserting ${codeData.code}:`, insertError)
      } else {
        console.log(`[Setup] Created invite code: ${codeData.code}`)
      }
    }

    // 5. 获取统计信息
    const { count: inviteCount } = await supabaseAdmin
      .from('affiliate_invite_codes')
      .select('*', { count: 'exact', head: true })

    const { count: affiliateCount } = await supabaseAdmin
      .from('affiliates')
      .select('*', { count: 'exact', head: true })

    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      message: "数据库初始化成功！",
      stats: {
        inviteCodes: inviteCount || 0,
        affiliates: affiliateCount || 0,
        users: userCount || 0,
      }
    })

  } catch (error) {
    console.error("[Setup] Database initialization error:", error)
    return NextResponse.json({ 
      error: "初始化失败",
      details: error instanceof Error ? error.message : String(error),
      needsManualSetup: true
    }, { status: 500 })
  }
}

// GET - 检查数据库状态
export async function GET() {
  try {
    const checks = {
      inviteCodesTable: false,
      affiliatesPasswordColumn: false,
      inviteCodesCount: 0,
      affiliatesCount: 0,
      usersCount: 0,
    }

    // 检查邀请码表
    const { data: inviteCodes, error: inviteError } = await supabaseAdmin
      .from('affiliate_invite_codes')
      .select('*', { count: 'exact' })
      .limit(1)

    checks.inviteCodesTable = !inviteError
    if (!inviteError) {
      const { count } = await supabaseAdmin
        .from('affiliate_invite_codes')
        .select('*', { count: 'exact', head: true })
      checks.inviteCodesCount = count || 0
    }

    // 检查 affiliates 表的 password_hash 列
    const { error: passwordError } = await supabaseAdmin
      .from('affiliates')
      .select('password_hash')
      .limit(1)
    
    checks.affiliatesPasswordColumn = !passwordError

    // 统计数据
    const { count: affiliateCount } = await supabaseAdmin
      .from('affiliates')
      .select('*', { count: 'exact', head: true })
    checks.affiliatesCount = affiliateCount || 0

    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    checks.usersCount = userCount || 0

    return NextResponse.json({
      success: true,
      checks,
      ready: checks.inviteCodesTable && checks.affiliatesPasswordColumn,
    })

  } catch (error) {
    console.error("[Setup] Status check error:", error)
    return NextResponse.json({ 
      error: "检查失败",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

