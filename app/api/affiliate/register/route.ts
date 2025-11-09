import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateReferralCode } from "@/lib/generate-referral-code"
import bcrypt from "bcryptjs"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, inviteCode } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 })
    }

    // Verify invite code
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("affiliate_invite_codes")
      .select("*")
      .eq("code", inviteCode)
      .eq("status", "active")
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 400 })
    }

    // Check if invite code is still valid
    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      return NextResponse.json({ error: "Invite code has reached maximum uses" }, { status: 400 })
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite code has expired" }, { status: 400 })
    }

    // Check if affiliate already exists
    const { data: existing } = await supabaseAdmin.from("affiliates").select("*").eq("email", email).single()

    if (existing) {
      return NextResponse.json({ error: "An affiliate account with this email already exists" }, { status: 400 })
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(email)
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const { data: codeCheck } = await supabaseAdmin
        .from("affiliates")
        .select("id")
        .eq("referral_code", referralCode)
        .single()

      if (!codeCheck) {
        isUnique = true
      } else {
        referralCode = generateReferralCode(email + attempts)
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: "Failed to generate unique referral code" }, { status: 500 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create affiliate account
    const { data: affiliate, error } = await supabaseAdmin
      .from("affiliates")
      .insert({
        email,
        name: name || null,
        referral_code: referralCode,
        password_hash: passwordHash,
        commission_rate: 10.0, // Default 10% commission
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating affiliate:", error)
      throw error
    }

    // Update invite code usage
    await supabaseAdmin
      .from("affiliate_invite_codes")
      .update({
        used_count: invite.used_count + 1,
        status: invite.max_uses && invite.used_count + 1 >= invite.max_uses ? "used" : "active",
        used_by_affiliate_id: affiliate.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invite.id)

    console.log("[v0] Affiliate created:", affiliate.id, "Code:", referralCode)

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const referralLink = `${baseUrl}/payment?ref=${referralCode}`

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        email: affiliate.email,
        name: affiliate.name,
        referralCode: affiliate.referral_code,
        referralLink,
        commissionRate: affiliate.commission_rate,
      },
    })
  } catch (error) {
    console.error("[v0] Affiliate registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
