import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const redirectUri = `${baseUrl}/api/auth/custom-google/callback`
  
  // 生成随机 state 用于 CSRF 保护
  const state = Math.random().toString(36).substring(7)
  
  // 将 state 保存到 cookie
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 分钟
    path: '/',
  })
  
  // 构建 Google OAuth URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId || "")
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent")
  
  return NextResponse.redirect(authUrl.toString())
}


