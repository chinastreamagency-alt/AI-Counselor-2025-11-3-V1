import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 追踪推荐链接点击
 * POST /api/affiliate/track-click
 */
export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json()

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 })
    }

    // 查询分销商
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from("affiliates")
      .select("id, referral_code, status")
      .eq("referral_code", referralCode.toUpperCase())
      .single()

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
    }

    // 检查分销商状态
    if (affiliate.status !== "active") {
      return NextResponse.json({ error: "Affiliate is not active" }, { status: 403 })
    }

    // 记录点击（如果有 affiliate_clicks 表）
    // 获取访客信息
    const userAgent = request.headers.get("user-agent") || "Unknown"
    const referer = request.headers.get("referer") || ""
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown"

    // 尝试记录点击（如果表不存在也不影响重定向）
    try {
      await supabaseAdmin.from("affiliate_clicks").insert({
        affiliate_id: affiliate.id,
        referral_code: referralCode.toUpperCase(),
        ip_address: ip,
        user_agent: userAgent,
        referer: referer,
        clicked_at: new Date().toISOString(),
      })
    } catch (clickError) {
      // 表可能不存在，忽略错误
      console.log("[Track Click] affiliate_clicks table may not exist yet:", clickError)
    }

    return NextResponse.json({
      success: true,
      affiliateId: affiliate.id,
      referralCode: affiliate.referral_code,
    })
  } catch (error) {
    console.error("[Track Click] Error:", error)
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 })
  }
}

