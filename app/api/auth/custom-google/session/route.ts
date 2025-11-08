import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('custom_session')
  
  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  
  try {
    const session = JSON.parse(sessionCookie.value)
    
    // 检查会话是否过期
    if (new Date(session.expires) < new Date()) {
      // 会话过期，删除 cookie
      cookieStore.delete('custom_session')
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    return NextResponse.json(session, { status: 200 })
  } catch (error) {
    console.error('Failed to parse session:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}


