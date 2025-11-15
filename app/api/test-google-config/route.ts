import { NextResponse } from "next/server"

export async function GET() {
  const config = {
    clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 30),
    clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    nextauthUrl: process.env.NEXTAUTH_URL,
    expectedAuthUrl: `${process.env.NEXTAUTH_URL}/api/auth/custom-google/callback`,
    nodeEnv: process.env.NODE_ENV,

    // Google OAuth 端点
    googleAuthEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    googleTokenEndpoint: 'https://oauth2.googleapis.com/token',

    // 配置检查
    checks: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrlIsHttps: process.env.NEXTAUTH_URL?.startsWith('https://'),
      nextAuthUrlHasWww: process.env.NEXTAUTH_URL?.includes('www.arina-ai.tech'),
    }
  }

  const allChecksPass = Object.values(config.checks).every(v => v === true)

  return NextResponse.json({
    ...config,
    status: allChecksPass ? 'OK' : 'CONFIGURATION_ERROR',
    message: allChecksPass
      ? '所有配置检查通过 ✅'
      : '配置存在问题，请检查环境变量 ❌'
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
}
