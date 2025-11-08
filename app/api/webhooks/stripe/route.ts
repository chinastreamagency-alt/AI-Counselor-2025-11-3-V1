import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"

// 禁用 Next.js 的 body 解析，因为 Stripe 需要原始 body
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    console.error("[Stripe Webhook] No signature found")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event

  try {
    // 验证 webhook 签名
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log("[Stripe Webhook] Event received:", event.type)
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // 处理不同类型的事件
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any
        console.log("[Stripe Webhook] Payment successful:", session.id)
        
        // 从 metadata 中获取购买信息
        const { userEmail, userName, productId, hours, affiliateId } = session.metadata
        
        console.log("[Stripe Webhook] Processing purchase:", {
          userEmail,
          userName,
          productId,
          hours,
          sessionId: session.id,
          amountTotal: session.amount_total,
        })

        // 为用户账户充值时间
        // 这里我们将购买信息保存到 localStorage（通过前端）
        // 因为我们使用的是 localStorage 而不是数据库
        
        // 在实际应用中，您应该：
        // 1. 将购买记录保存到数据库
        // 2. 更新用户的可用时间
        // 3. 发送确认邮件
        
        console.log("[Stripe Webhook] ✅ Payment processed successfully")
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as any
        console.log("[Stripe Webhook] Checkout session expired:", session.id)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any
        console.log("[Stripe Webhook] Payment failed:", paymentIntent.id)
        break
      }

      default:
        console.log("[Stripe Webhook] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[Stripe Webhook] Error processing event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

