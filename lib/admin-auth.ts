import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

// Use service role for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function verifyAdminCredentials(username: string, password: string) {
  try {
    const { data: admin, error } = await supabaseAdmin.from("admin_users").select("*").eq("username", username).single()

    if (error || !admin) {
      return null
    }

    const isValid = await bcrypt.compare(password, admin.password_hash)
    if (!isValid) {
      return null
    }

    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    }
  } catch (error) {
    console.error("[v0] Error verifying admin credentials:", error)
    return null
  }
}

export async function createAdminUser(username: string, email: string, password: string) {
  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .insert({
        username,
        email,
        password_hash: passwordHash,
        role: "admin",
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("[v0] Error creating admin user:", error)
    throw error
  }
}
