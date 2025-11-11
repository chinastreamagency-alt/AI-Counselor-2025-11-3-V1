import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const affiliateId = searchParams.get("id")

    if (!affiliateId) {
      return NextResponse.json({ error: "分销商ID是必填项" }, { status: 400 })
    }

    // 检查是否有关联的订单
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("affiliate_id", affiliateId)
      .limit(1)

    if (ordersError) {
      console.error("[Admin] Error checking orders:", ordersError)
      throw ordersError
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { 
          error: "无法删除：该分销商有关联订单",
          suggestion: "建议将状态改为'停用'而不是删除"
        },
        { status: 400 }
      )
    }

    // 删除关联的佣金记录
    const { error: commissionsError } = await supabaseAdmin
      .from("commissions")
      .delete()
      .eq("affiliate_id", affiliateId)

    if (commissionsError) {
      console.error("[Admin] Error deleting commissions:", commissionsError)
    }

    // 删除分销商
    const { error: deleteError } = await supabaseAdmin
      .from("affiliates")
      .delete()
      .eq("id", affiliateId)

    if (deleteError) {
      console.error("[Admin] Error deleting affiliate:", deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true, message: "分销商已删除" })
  } catch (error) {
    console.error("[Admin] Delete affiliate error:", error)
    return NextResponse.json({ error: "删除分销商失败" }, { status: 500 })
  }
}

