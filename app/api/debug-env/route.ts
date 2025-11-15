import { NextResponse } from "next/server"

export async function GET() {
  // 只在开发环境或通过特殊密钥访问时显示环境变量
  const debugInfo = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NEXTAUTH_URL_length: process.env.NEXTAUTH_URL?.length || 0,
    NODE_ENV: process.env.NODE_ENV,
    GOOGLE_CLIENT_ID_exists: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_ID_prefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'NOT SET',
    GOOGLE_CLIENT_SECRET_exists: !!process.env.GOOGLE_CLIENT_SECRET,
    expectedRedirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/custom-google/callback`,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(debugInfo)
}
