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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const affiliateId = params.id

    const { data: commissions, error } = await supabaseAdmin
      .from("commissions")
      .select(`
        *,
        orders!inner(
          id,
          amount,
          created_at,
          users!inner(email, name)
        )
      `)
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ commissions })
  } catch (error) {
    console.error("[v0] Error fetching commissions:", error)
    return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 })
  }
}
