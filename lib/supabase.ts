import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Type definitions for database tables
export type Database = {
  orders: {
    id: string
    user_id: string
    amount: number
    status: string
    created_at: string
  }
  affiliates: {
    id: string
    user_id: string
    code: string
    commission_rate: number
    created_at: string
  }
  commissions: {
    id: string
    affiliate_id: string
    order_id: string
    amount: number
    status: string
    created_at: string
  }
}
