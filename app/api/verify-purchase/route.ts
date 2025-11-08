import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getProductById } from "@/lib/products"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID provided" }, { status: 400 })
    }

    console.log("[Verify Purchase] Retrieving session:", sessionId)

    // 从 Stripe 获取支付会话详情
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    console.log("[Verify Purchase] Session retrieved:", {
      id: session.id,
      status: session.payment_status,
      metadata: session.metadata,
    })

    // 验证支付是否成功
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment not completed",
        },
        { status: 400 },
      )
    }

    // 从 metadata 获取购买信息
    const { productId, hours } = session.metadata || {}

    if (!productId || !hours) {
      console.error("[Verify Purchase] Missing metadata:", session.metadata)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session metadata",
        },
        { status: 400 },
      )
    }

    // 获取产品详情
    const product = getProductById(productId)
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 },
      )
    }

    // 返回购买详情
    return NextResponse.json({
      success: true,
      hours: parseInt(hours),
      amount: session.amount_total || 0,
      productName: product.name,
      sessionId: session.id,
      customerEmail: session.customer_email,
    })
  } catch (error: any) {
    console.error("[Verify Purchase] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to verify purchase",
      },
      { status: 500 },
    )
  }
}

