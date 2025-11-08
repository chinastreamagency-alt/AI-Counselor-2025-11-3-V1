import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

// Use service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error("[v0] Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log("[v0] Stripe webhook event:", event.type)

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.userId
      const productId = session.metadata?.productId
      const hours = Number.parseFloat(session.metadata?.hours || "0")
      const affiliateId = session.metadata?.affiliateId || null

      if (!userId || !productId || !hours) {
        console.error("[v0] Missing metadata in checkout session")
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
      }

      console.log("[v0] Processing payment for user:", userId, "hours:", hours)

      // Create order record
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: userId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: (session.amount_total || 0) / 100, // Convert cents to dollars
          currency: session.currency || "usd",
          hours_purchased: hours,
          price_per_hour: (session.amount_total || 0) / 100 / hours,
          status: "completed",
          affiliate_id: affiliateId,
        })
        .select()
        .single()

      if (orderError) {
        console.error("[v0] Error creating order:", orderError)
        throw orderError
      }

      console.log("[v0] Order created:", order.id)

      // 数据库触发器会自动：
      // 1. 更新用户的 total_hours
      // 2. 如果有 affiliate_id，创建佣金记录并更新推广人员的佣金总额
      
      if (affiliateId) {
        console.log("[v0] Affiliate commission will be created by database trigger for affiliate:", affiliateId)
      }

      return NextResponse.json({ received: true })
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Update order status to failed
      await supabaseAdmin.from("orders").update({ status: "failed" }).eq("stripe_payment_intent_id", paymentIntent.id)

      console.log("[v0] Payment failed for intent:", paymentIntent.id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
