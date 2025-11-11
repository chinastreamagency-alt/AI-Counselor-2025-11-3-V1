import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Fetch user's total hours from database
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("total_hours")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("[User Hours] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch user hours" }, { status: 500 })
    }

    // Fetch usage logs to calculate used minutes
    const { data: usageLogs, error: usageError } = await supabaseAdmin
      .from("usage_logs")
      .select("minutes_used")
      .eq("user_id", userId)

    if (usageError) {
      console.error("[User Hours] Usage logs error:", usageError)
      // Don't fail the request, just return 0 used minutes
    }

    const usedMinutes = usageLogs?.reduce((sum, log) => sum + (log.minutes_used || 0), 0) || 0
    const totalHours = user.total_hours || 0

    return NextResponse.json({
      success: true,
      totalHours,
      usedMinutes,
      remainingMinutes: Math.max(0, totalHours * 60 - usedMinutes),
    })
  } catch (error) {
    console.error("[User Hours] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
