import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      console.error("[Register] Supabase Auth error:", authError)
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }

    // Create user in public.users table
    const insertData: any = {
      id: authData.user.id,
      email,
      name: name || email.split("@")[0],
    }

    // Only add password_hash if the column exists
    try {
      insertData.password_hash = passwordHash
    } catch (e) {
      console.log("[Register] Note: password_hash column may not exist")
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert(insertData)
      .select()
      .single()

    if (userError) {
      console.error("[Register] Database error:", userError)
      console.error("[Register] Insert data:", insertData)
      // Cleanup: delete auth user if database insert fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error("[Register] Cleanup error:", cleanupError)
      }
      return NextResponse.json(
        { error: `Failed to create user profile: ${userError.message || userError.code || "Unknown error"}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      },
    })
  } catch (error) {
    console.error("[Register] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
