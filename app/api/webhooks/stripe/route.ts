import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"
import { loadUserProfile, saveUserProfile } from "@/lib/user-profile"

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

        if (!userEmail || !hours) {
          console.error("[Stripe Webhook] Missing required metadata")
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        // 为用户账户充值时间
        const purchasedHours = parseInt(hours, 10)
        const userProfile = loadUserProfile(userEmail)
        
        // 更新用户的购买小时数
        userProfile.purchasedHours = (userProfile.purchasedHours || 0) + purchasedHours
        userProfile.lastUpdated = new Date().toISOString()
        
        saveUserProfile(userProfile)
        
        console.log("[Stripe Webhook] ✅ Added", purchasedHours, "hours to", userEmail)
        console.log("[Stripe Webhook] Total hours now:", userProfile.purchasedHours)
        
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

      case "charge.refunded": {
        const charge = event.data.object as any
        console.log("[Stripe Webhook] 🚨 Refund detected:", charge.id)
        console.log("[Stripe Webhook] Amount refunded:", charge.amount_refunded / 100, "USD")
        
        // 注意：根据您的退款政策，这里可能需要从用户账户扣除时间
        // 但是 charge 对象中没有直接包含 session metadata
        // 您可能需要通过 charge.payment_intent 查找原始 session
        
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

