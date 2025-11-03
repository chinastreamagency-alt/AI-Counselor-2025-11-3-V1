import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { createClient } from "@supabase/supabase-js"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function verifyAffiliate(request: NextRequest) {
  const token = request.cookies.get("affiliate_token")?.value

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

export async function GET(request: NextRequest) {
  try {
    const affiliate = await verifyAffiliate(request)

    if (!affiliate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const affiliateId = affiliate.affiliateId as string

    // Get affiliate details
    const { data: affiliateData } = await supabaseAdmin.from("affiliates").select("*").eq("id", affiliateId).single()

    if (!affiliateData) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    // Get total orders count
    const { count: totalOrders } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_id", affiliateId)
      .eq("status", "completed")

    // Get total revenue generated
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("amount")
      .eq("affiliate_id", affiliateId)
      .eq("status", "completed")

    const totalRevenue = orders?.reduce((sum, order) => sum + order.amount, 0) || 0

    return NextResponse.json({
      totalCommission: affiliateData.total_commission || 0,
      settledCommission: affiliateData.settled_commission || 0,
      unsettledCommission: affiliateData.unsettled_commission || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      commissionRate: affiliateData.commission_rate,
      referralCode: affiliateData.referral_code,
    })
  } catch (error) {
    console.error("[v0] Error fetching affiliate stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
