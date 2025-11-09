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

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total revenue
    const { data: revenueData } = await supabaseAdmin.from("orders").select("amount").eq("status", "completed")

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.amount, 0) || 0

    // Get total orders
    const { count: totalOrders } = await supabaseAdmin.from("orders").select("*", { count: "exact", head: true })

    // Get total users
    const { count: totalUsers } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true })

    // Get total affiliates
    const { count: totalAffiliates } = await supabaseAdmin
      .from("affiliates")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      totalRevenue,
      totalOrders: totalOrders || 0,
      totalUsers: totalUsers || 0,
      totalAffiliates: totalAffiliates || 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
