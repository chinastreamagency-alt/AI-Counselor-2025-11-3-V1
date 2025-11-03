import { createClient } from "@/lib/supabase/server"

export async function startUsageSession(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("usage_logs")
    .insert({
      user_id: userId,
      session_start: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error starting usage session:", error)
    throw error
  }

  return data
}

export async function endUsageSession(sessionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("usage_logs")
    .update({
      session_end: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error ending usage session:", error)
    throw error
  }

  return data
}

export async function getUserHours(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("users").select("total_hours, used_hours").eq("id", userId).single()

  if (error) {
    console.error("[v0] Error getting user hours:", error)
    return { total_hours: 0, used_hours: 0 }
  }

  return {
    total_hours: data.total_hours || 0,
    used_hours: data.used_hours || 0,
    remaining_hours: (data.total_hours || 0) - (data.used_hours || 0),
  }
}
