import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { createClient } from "@supabase/supabase-js"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { commissionIds } = await request.json()

    if (!commissionIds || !Array.isArray(commissionIds)) {
      return NextResponse.json({ error: "Commission IDs array required" }, { status: 400 })
    }

    // Update commissions to settled
    const { data: settledCommissions, error: commissionError } = await supabaseAdmin
      .from("commissions")
      .update({
        status: "settled",
        settled_at: new Date().toISOString(),
      })
      .in("id", commissionIds)
      .eq("status", "pending")
      .select()

    if (commissionError) {
      throw commissionError
    }

    // Update affiliate settled/unsettled amounts
    const affiliateUpdates = new Map<string, number>()

    for (const commission of settledCommissions) {
      const current = affiliateUpdates.get(commission.affiliate_id) || 0
      affiliateUpdates.set(commission.affiliate_id, current + commission.amount)
    }

    for (const [affiliateId, amount] of affiliateUpdates.entries()) {
      await supabaseAdmin.rpc("update_affiliate_settlement", {
        p_affiliate_id: affiliateId,
        p_amount: amount,
      })
    }

    return NextResponse.json({
      success: true,
      settledCount: settledCommissions.length,
    })
  } catch (error) {
    console.error("[v0] Error settling commissions:", error)
    return NextResponse.json({ error: "Failed to settle commissions" }, { status: 500 })
  }
}
