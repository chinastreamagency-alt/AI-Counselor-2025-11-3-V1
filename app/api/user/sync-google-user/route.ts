import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 同步Google Fallback用户到Supabase
 * 用于处理临时ID用户，创建或查找真实的Supabase用户ID
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name, image } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log(`[Sync User] Syncing Google user: ${email}`)

    // 1. 先查找是否已存在用户
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .single()

    if (existingUser) {
      // 用户已存在，返回真实ID
      console.log(`[Sync User] Found existing user: ${existingUser.id}`)
      return NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name || name,
        },
        message: "User found in database",
      })
    }

    // 2. 用户不存在，创建新用户
    console.log(`[Sync User] User not found, creating new user...`)

    // 在 auth.users 表中创建用户
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        name: name || email.split("@")[0],
        picture: image,
        provider: "google",
      },
    })

    if (authError || !authUser.user) {
      console.error(`[Sync User] Failed to create auth user:`, authError)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    const userId = authUser.user.id
    console.log(`[Sync User] Created auth user: ${userId}`)

    // 在 users 表中创建记录
    const { error: dbError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email,
      name: name || email.split("@")[0],
      total_hours: 0,
      used_hours: 0,
    })

    if (dbError) {
      // 如果是重复键错误，忽略（可能触发器已创建）
      if (dbError.code !== "23505") {
        console.error(`[Sync User] Failed to create user record:`, dbError)
        // 不阻止返回，因为auth用户已创建
      }
    } else {
      console.log(`[Sync User] Created user record in database`)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name: name || email.split("@")[0],
      },
      message: "New user created",
    })
  } catch (error) {
    console.error("[Sync User] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

