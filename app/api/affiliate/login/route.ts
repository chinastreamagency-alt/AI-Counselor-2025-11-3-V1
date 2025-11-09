import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SignJWT } from "jose"
import bcrypt from "bcryptjs"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Find affiliate by email
    const { data: affiliate, error } = await supabaseAdmin.from("affiliates").select("*").eq("email", email).single()

    if (error || !affiliate) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (affiliate.status !== "active") {
      return NextResponse.json({ error: "Affiliate account is not active" }, { status: 403 })
    }

    // Verify password
    if (!affiliate.password_hash) {
      return NextResponse.json({ error: "Account requires password setup. Please contact support." }, { status: 400 })
    }

    const isValidPassword = await bcrypt.compare(password, affiliate.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create JWT token
    const token = await new SignJWT({
      affiliateId: affiliate.id,
      email: affiliate.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    const response = NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        email: affiliate.email,
        name: affiliate.name,
        referralCode: affiliate.referral_code,
        commissionRate: affiliate.commission_rate,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set("affiliate_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("[v0] Affiliate login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
