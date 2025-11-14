import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  console.log('[Session API] Checking for session cookie...')
  
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('custom_session')
  
  console.log('[Session API] Cookie found:', !!sessionCookie)
  
  if (!sessionCookie) {
    console.log('[Session API] No session cookie, returning null')
    return NextResponse.json({ user: null }, { status: 200 })
  }
  
  try {
    const session = JSON.parse(sessionCookie.value)
    console.log('[Session API] Session parsed:', { 
      email: session.user?.email, 
      expires: session.expires 
    })
    
    // 检查会话是否过期
    if (new Date(session.expires) < new Date()) {
      // 会话过期，删除 cookie
      console.log('[Session API] Session expired, deleting cookie')
      cookieStore.delete('custom_session')
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    console.log('[Session API] Returning valid session')
    return NextResponse.json(session, { status: 200 })
  } catch (error) {
    console.error('[Session API] Failed to parse session:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}


