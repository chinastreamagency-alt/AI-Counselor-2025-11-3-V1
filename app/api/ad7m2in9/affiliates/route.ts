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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabaseAdmin.from("affiliates").select("*").order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: affiliates, error } = await query

    if (error) {
      throw error
    }

    // Get order counts for each affiliate
    const affiliatesWithStats = await Promise.all(
      affiliates.map(async (affiliate) => {
        const { count: orderCount } = await supabaseAdmin
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("affiliate_id", affiliate.id)
          .eq("status", "completed")

        return {
          ...affiliate,
          orderCount: orderCount || 0,
        }
      }),
    )

    return NextResponse.json({ affiliates: affiliatesWithStats })
  } catch (error) {
    console.error("[v0] Error fetching affiliates:", error)
    return NextResponse.json({ error: "Failed to fetch affiliates" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { affiliateId, status, commissionRate } = await request.json()

    if (!affiliateId) {
      return NextResponse.json({ error: "Affiliate ID required" }, { status: 400 })
    }

    const updates: any = {}
    if (status) updates.status = status
    if (commissionRate !== undefined) updates.commission_rate = commissionRate

    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .update(updates)
      .eq("id", affiliateId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ affiliate: data })
  } catch (error) {
    console.error("[v0] Error updating affiliate:", error)
    return NextResponse.json({ error: "Failed to update affiliate" }, { status: 500 })
  }
}
