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
    const { data: inviteCodes, error } = await supabaseAdmin
      .from("affiliate_invite_codes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, inviteCodes })
  } catch (error) {
    console.error("[Admin] Error fetching invite codes:", error)
    return NextResponse.json({ error: "Failed to fetch invite codes" }, { status: 500 })
  }
}

// POST - Create new invite code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code: customCode, maxUses = 1, expiresAt, createdBy = "admin" } = body

    // Use custom code or generate one
    let code = customCode || generateCode()
    
    // Check if code is unique
    if (customCode) {
      const { data: existing } = await supabaseAdmin
        .from("affiliate_invite_codes")
        .select("id")
        .eq("code", code)
        .single()

      if (existing) {
        return NextResponse.json({ error: "该邀请码已存在" }, { status: 400 })
      }
    } else {
      // Generate unique code
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
    }

    // Create invite code
    const { data: inviteCode, error } = await supabaseAdmin
      .from("affiliate_invite_codes")
      .insert({
        code: code.toUpperCase(),
        created_by: createdBy,
        max_uses: maxUses,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) {
      console.error("[Admin] Error creating invite code:", error)
      throw error
    }

    return NextResponse.json({ success: true, inviteCode })
  } catch (error) {
    console.error("[Admin] Error creating invite code:", error)
    return NextResponse.json({ error: "Failed to create invite code" }, { status: 500 })
  }
}

// PATCH - Update invite code status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("affiliate_invite_codes")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin] Error updating invite code:", error)
    return NextResponse.json({ error: "Failed to update invite code" }, { status: 500 })
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

