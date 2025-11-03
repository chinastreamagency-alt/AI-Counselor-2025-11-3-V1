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

    // Get orders with commission info
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        users!inner(email, name),
        commissions!left(id, amount, status, settled_at)
      `)
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[v0] Error fetching affiliate orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
