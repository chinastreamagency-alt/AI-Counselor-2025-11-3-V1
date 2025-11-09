import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Generate random invite code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed similar-looking characters
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET - List all invite codes
export async function GET() {
  try {
    const { data: codes, error } = await supabaseAdmin
      .from("affiliate_invite_codes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ codes })
  } catch (error) {
    console.error("[Admin] Error fetching invite codes:", error)
    return NextResponse.json({ error: "Failed to fetch invite codes" }, { status: 500 })
  }
}

// POST - Create new invite code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { maxUses = 1, expiresInDays } = body

    // Generate unique code
    let code = generateCode()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from("affiliate_invite_codes")
        .select("id")
        .eq("code", code)
        .single()

      if (!existing) {
        isUnique = true
      } else {
        code = generateCode()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 })
    }

    // Calculate expiry date if specified
    let expiresAt = null
    if (expiresInDays) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + expiresInDays)
      expiresAt = expiry.toISOString()
    }

    // Create invite code
    const { data: inviteCode, error } = await supabaseAdmin
      .from("affiliate_invite_codes")
      .insert({
        code,
        created_by: "admin",
        max_uses: maxUses,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, inviteCode })
  } catch (error) {
    console.error("[Admin] Error creating invite code:", error)
    return NextResponse.json({ error: "Failed to create invite code" }, { status: 500 })
  }
}

// DELETE - Delete an invite code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("affiliate_invite_codes").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin] Error deleting invite code:", error)
    return NextResponse.json({ error: "Failed to delete invite code" }, { status: 500 })
  }
}

