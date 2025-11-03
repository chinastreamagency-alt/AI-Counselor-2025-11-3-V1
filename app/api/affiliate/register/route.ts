import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateReferralCode } from "@/lib/generate-referral-code"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
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

    // Create affiliate account
    const { data: affiliate, error } = await supabaseAdmin
      .from("affiliates")
      .insert({
        email,
        name: name || null,
        referral_code: referralCode,
        commission_rate: 10.0, // Default 10% commission
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating affiliate:", error)
      throw error
    }

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
