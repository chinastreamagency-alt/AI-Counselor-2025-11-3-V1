import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // 验证输入
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "姓名、邮箱和密码是必填项" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要6个字符" },
        { status: 400 }
      )
    }

    // 使用 Supabase Auth 创建用户
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 自动确认邮箱
      user_metadata: {
        name,
      },
    })

    if (authError) {
      console.error("[Register] Auth error:", authError)
      
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "该邮箱已被注册" },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: authError.message || "注册失败" },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "创建用户失败" },
        { status: 500 }
      )
    }

    // 在 users 表中创建记录
    const { error: dbError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      email,
      name,
      total_hours: 0,
      used_hours: 0,
    })

    if (dbError) {
      console.error("[Register] Database error:", dbError)
      // 如果数据库插入失败，删除已创建的 auth 用户
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: "注册失败，请重试" },
        { status: 500 }
      )
    }

    console.log("[Register] User created successfully:", email)

    // 创建会话
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        name,
      },
    })
  } catch (error: any) {
    console.error("[Register] Error:", error)
    return NextResponse.json(
      { error: error.message || "注册失败" },
      { status: 500 }
    )
  }
}

