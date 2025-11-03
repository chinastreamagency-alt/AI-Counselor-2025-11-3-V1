import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting usage session for user:", user.id)

    // Create usage log entry
    const { data, error } = await supabase
      .from("usage_logs")
      .insert({
        user_id: user.id,
        session_start: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error starting usage session:", error)
      throw error
    }

    console.log("[v0] Usage session started:", data.id)

    return NextResponse.json({ sessionId: data.id })
  } catch (error) {
    console.error("[v0] Error in start usage API:", error)
    return NextResponse.json({ error: "Failed to start usage session" }, { status: 500 })
  }
}
