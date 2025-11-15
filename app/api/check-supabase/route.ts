import { NextResponse } from "next/server"

export async function GET() {
  const config = {
    supabaseUrlExists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    serviceRoleKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',

    checks: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlIsHttps: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://'),
    }
  }

  const allChecksPass = Object.values(config.checks).every(v => v === true)

  // 尝试连接到 Supabase
  let connectionTest = 'NOT_TESTED'
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 简单的查询测试
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true })

    if (error) {
      connectionTest = `ERROR: ${error.message}`
    } else {
      connectionTest = 'SUCCESS'
    }
  } catch (err) {
    connectionTest = `EXCEPTION: ${err instanceof Error ? err.message : String(err)}`
  }

  return NextResponse.json({
    ...config,
    connectionTest,
    status: allChecksPass && connectionTest === 'SUCCESS' ? 'OK' : 'ERROR',
    message: allChecksPass && connectionTest === 'SUCCESS'
      ? 'Supabase 配置正常 ✅'
      : 'Supabase 配置存在问题 ❌'
  })
}
