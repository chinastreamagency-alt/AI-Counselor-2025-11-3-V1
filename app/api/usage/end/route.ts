import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Ending usage session:", sessionId)

    // Update usage log with end time
    const { data, error } = await supabase
      .from("usage_logs")
      .update({
        session_end: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error ending usage session:", error)
      throw error
    }

    console.log("[v0] Usage session ended:", data.id, "Duration:", data.duration_hours, "hours")

    return NextResponse.json({
      sessionId: data.id,
      durationHours: data.duration_hours,
    })
  } catch (error) {
    console.error("[v0] Error in end usage API:", error)
    return NextResponse.json({ error: "Failed to end usage session" }, { status: 500 })
  }
}
