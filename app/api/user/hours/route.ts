import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's hours
    const { data, error } = await supabase.from("users").select("total_hours, used_hours").eq("id", user.id).single()

    if (error) {
      console.error("[v0] Error getting user hours:", error)
      throw error
    }

    const totalHours = data?.total_hours || 0
    const usedHours = data?.used_hours || 0
    const remainingHours = totalHours - usedHours

    return NextResponse.json({
      totalHours,
      usedHours,
      remainingHours,
    })
  } catch (error) {
    console.error("[v0] Error in get hours API:", error)
    return NextResponse.json({ error: "Failed to get user hours" }, { status: 500 })
  }
}
