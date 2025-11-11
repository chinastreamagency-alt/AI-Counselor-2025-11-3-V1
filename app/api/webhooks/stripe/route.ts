import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
          affiliateId,
        })

        if (!userEmail || !hours) {
          console.error("[Stripe Webhook] Missing required metadata")
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        const purchasedHours = parseFloat(hours)
        const amountPaid = session.amount_total / 100 // Convert cents to dollars

        try {
          // 1. 查找用户
          const { data: user, error: userError } = await supabaseAdmin
            .from("users")
            .select("id, total_hours")
            .eq("email", userEmail)
            .single()

          if (userError || !user) {
            console.error("[Stripe Webhook] User not found:", userError)
            return NextResponse.json({ error: "User not found" }, { status: 404 })
          }

          console.log("[Stripe Webhook] Found user:", user.id, "current hours:", user.total_hours)

          // 2. 更新用户的总时长
          const newTotalHours = (user.total_hours || 0) + purchasedHours
          const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({ 
              total_hours: newTotalHours,
              updated_at: new Date().toISOString()
            })
            .eq("id", user.id)

          if (updateError) {
            console.error("[Stripe Webhook] Failed to update user hours:", updateError)
            return NextResponse.json({ error: "Failed to update hours" }, { status: 500 })
          }

          console.log("[Stripe Webhook] ✅ Updated user hours from", user.total_hours, "to", newTotalHours)

          // 3. 创建订单记录
          const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
              user_id: user.id,
              stripe_session_id: session.id,
              amount: amountPaid,
              hours: purchasedHours,
              status: "completed",
              affiliate_id: affiliateId || null,
            })
            .select()
            .single()

          if (orderError) {
            console.error("[Stripe Webhook] Failed to create order:", orderError)
            // Don't return error - hours already updated
          } else {
            console.log("[Stripe Webhook] ✅ Order created:", order.id)

            // 4. 如果有推荐人，创建佣金记录
            if (affiliateId) {
              // 获取推荐人的佣金比例
              const { data: affiliate } = await supabaseAdmin
                .from("affiliates")
                .select("commission_rate")
                .eq("id", affiliateId)
                .single()

              if (affiliate) {
                const commissionRate = affiliate.commission_rate || 10
                const commissionAmount = (amountPaid * commissionRate) / 100

                const { error: commissionError } = await supabaseAdmin
                  .from("commissions")
                  .insert({
                    affiliate_id: affiliateId,
                    order_id: order.id,
                    amount: commissionAmount,
                    status: "pending",
                  })

                if (commissionError) {
                  console.error("[Stripe Webhook] Failed to create commission:", commissionError)
                } else {
                  console.log("[Stripe Webhook] ✅ Commission created:", commissionAmount, "USD")
                }
              }
            }
          }
        } catch (dbError: any) {
          console.error("[Stripe Webhook] Database error:", dbError)
          return NextResponse.json({ error: "Database error" }, { status: 500 })
        }
        
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

