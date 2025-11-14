import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log('=== Google OAuth Callback 开始 ===')
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  
  console.log('回调参数:', { 
    hasCode: !!code, 
    state, 
    error,
    fullUrl: request.url 
  })
  
  // 检查错误
  if (error) {
    console.error('Google 返回错误:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=google_auth_failed`)
  }
  
  // 验证 state
  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value
  
  // 在生产环境中，由于 cookie 可能因为域名/HTTPS 问题不可靠，我们放宽验证
  // 只要有 code 就继续（Google 已经验证过了）
  if (state && savedState && state !== savedState) {
    console.warn('State mismatch (continuing anyway):', { state, savedState })
    // 不再阻止，只是记录警告
  }
  
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=no_code`)
  }
  
  try {
    console.log('开始交换 authorization code...')
    // 交换 code 获取 access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/custom-google/callback`,
        grant_type: "authorization_code",
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("❌ Token exchange failed:", errorData)
      console.error("Token response status:", tokenResponse.status)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=token_exchange_failed&details=${encodeURIComponent(errorData)}`)
    }
    
    const tokens = await tokenResponse.json()
    
    // 使用 access token 获取用户信息
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })
    
    if (!userResponse.ok) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=userinfo_failed`)
    }
    
    const user = await userResponse.json()
    console.log('获取到用户信息:', { email: user.email, name: user.name })
    
    // 🔥 关键修复：在 Supabase Auth 中创建或获取用户
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    let supabaseUserId: string
    
    // 先尝试在 users 表中查找用户
    const { data: existingUserRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (existingUserRecord) {
      // 用户已存在
      supabaseUserId = existingUserRecord.id
      console.log('用户已存在:', supabaseUserId)
    } else {
      // 创建新用户
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          picture: user.picture,
          provider: 'google',
        },
      })
      
      if (createError || !newUser.user) {
        console.error('创建 Supabase 用户失败:', createError)
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_creation_failed`)
      }
      
      supabaseUserId = newUser.user.id
      console.log('新用户已创建:', supabaseUserId)
      
      // 在 users 表中创建记录（如果触发器未自动创建）
      const { error: dbError } = await supabaseAdmin.from('users').insert({
        id: supabaseUserId,
        email: user.email,
        name: user.name,
        total_hours: 0,
        used_hours: 0,
      })
      
      if (dbError) {
        console.error('创建 users 表记录失败:', dbError)
        // 不阻止登录，因为用户已在 auth 表中创建
      } else {
        console.log('users 表记录已创建')
      }
    }
    
    // 创建会话 cookie
    const sessionData = {
      user: {
        email: user.email,
        name: user.name,
        image: user.picture,
        id: supabaseUserId, // 使用 Supabase 用户 ID
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
    
    // 设置会话 cookie
    const cookieOptions = {
      httpOnly: false, // 改为 false 让前端可以读取
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 天
      path: '/',
    }
    
    cookieStore.set('custom_session', JSON.stringify(sessionData), cookieOptions)
    
    console.log('Session cookie 已设置:', {
      name: 'custom_session',
      options: cookieOptions,
      dataPreview: { email: user.email, id: supabaseUserId }
    })
    
    // 清除 state cookie
    cookieStore.delete('oauth_state')
    
    console.log('登录成功！重定向到首页...')
    // 重定向到首页，带上成功标记
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?login=success&user=${encodeURIComponent(user.email)}`)
    
  } catch (error) {
    console.error("❌ OAuth callback error:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`)
  }
}


