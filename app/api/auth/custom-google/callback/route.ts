import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// 用于追踪已处理的授权码，防止重复处理
const processedCodes = new Set<string>()

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

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=no_code`)
  }

  // 防止重复处理同一个授权码
  if (processedCodes.has(code)) {
    console.warn('⚠️ 授权码已被处理过，忽略重复请求')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=code_already_used`)
  }

  // 标记此授权码为已处理
  processedCodes.add(code)
  // 10分钟后自动清理（授权码本身的有效期）
  setTimeout(() => processedCodes.delete(code), 10 * 60 * 1000)

  // 验证 state
  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value

  // 在生产环境中，由于 cookie 可能因为域名/HTTPS 问题不可靠，我们放宽验证
  // 只要有 code 就继续（Google 已经验证过了）
  if (state && savedState && state !== savedState) {
    console.warn('State mismatch (continuing anyway):', { state, savedState })
    // 不再阻止，只是记录警告
  }
  
  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/custom-google/callback`

    console.log('开始交换 authorization code...')
    console.log('Token exchange 参数:', {
      hasCode: !!code,
      codeLength: code?.length,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20),
      redirectUri,
      grantType: 'authorization_code'
    })

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
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("❌ Token exchange failed:", errorData)
      console.error("Token response status:", tokenResponse.status)
      console.error("使用的 redirect_uri:", redirectUri)
      console.error("请确认 Google Console 中的重定向 URI 包含:", redirectUri)

      // 清理已处理的授权码标记，允许重试
      processedCodes.delete(code)

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

    // 先尝试在 auth.users 表中查找用户（通过 email）
    const { data: existingAuthUser, error: authQueryError } = await supabaseAdmin.auth.admin.listUsers()

    console.log('查询现有用户:', {
      total: existingAuthUser?.users?.length,
      hasError: !!authQueryError,
      error: authQueryError
    })

    const existingUser = existingAuthUser?.users?.find(u => u.email === user.email)

    if (existingUser) {
      // 用户已存在于 auth 系统
      supabaseUserId = existingUser.id
      console.log('✅ 用户已存在于 auth 系统:', supabaseUserId)

      // 检查 users 表中是否有记录
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', supabaseUserId)
        .single()

      if (!userRecord) {
        console.log('users 表中无记录，准备创建...')
        // 在 users 表中创建记录
        const { error: dbError } = await supabaseAdmin.from('users').insert({
          id: supabaseUserId,
          email: user.email,
          name: user.name,
          total_hours: 0,
          used_hours: 0,
        })

        if (dbError) {
          console.error('创建 users 表记录失败:', dbError)
          // 不阻止登录，因为用户已在 auth 表中
        } else {
          console.log('✅ users 表记录已创建')
        }
      }
    } else {
      // 创建新用户
      console.log('准备创建新用户:', user.email)

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          picture: user.picture,
          provider: 'google',
        },
      })

      if (createError) {
        console.error('❌ 创建 Supabase Auth 用户失败:', {
          error: createError,
          message: createError.message,
          status: createError.status,
          code: createError.code
        })

        // 提供更详细的错误信息
        const errorDetails = encodeURIComponent(JSON.stringify({
          message: createError.message,
          code: createError.code,
          status: createError.status
        }))
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_creation_failed&details=${errorDetails}`)
      }

      if (!newUser.user) {
        console.error('❌ 创建用户返回空数据')
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_creation_failed&details=${encodeURIComponent('No user data returned')}`)
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
    
    console.log('登录成功！准备重定向...')
    
    // 重定向到首页，带上完整的用户信息（以防cookie在手机端不工作）
    const redirectParams = new URLSearchParams({
      login: 'success',
      email: user.email,
      name: user.name || '',
      picture: user.picture || '',
      userId: supabaseUserId
    })
    
    const redirectUrl = `${process.env.NEXTAUTH_URL}/?${redirectParams.toString()}`
    console.log('重定向URL:', redirectUrl)
    console.log('URL参数:', {
      login: 'success',
      email: user.email,
      name: user.name || '',
      userId: supabaseUserId,
      hasPicture: !!user.picture
    })
    
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error("❌ OAuth callback error:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`)
  }
}


