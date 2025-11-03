import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getProductById } from "@/lib/products"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { productId, affiliateCode } = await request.json()

    console.log("[v0] Creating checkout session for product:", productId)

    // Get product details
    const product = getProductById(productId)
    if (!product) {
      console.error("[v0] Product not found:", productId)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("[v0] Product found:", product)

    // Get user from Supabase auth
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.error("[v0] No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.email)

    // Look up affiliate if code provided
    let affiliateId: string | undefined
    if (affiliateCode) {
      const { data: affiliate, error: affiliateError } = await supabase
        .from("affiliates")
        .select("id")
        .eq("referral_code", affiliateCode)
        .eq("status", "active")
        .single()

      if (affiliateError) {
        console.log("[v0] Affiliate lookup error (non-critical):", affiliateError.message)
      }

      if (affiliate) {
        affiliateId = affiliate.id
        console.log("[v0] Affiliate found:", affiliateId)
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const successUrl = `${baseUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/payment?canceled=true`

    console.log("[v0] Base URL:", baseUrl)
    console.log("[v0] Success URL:", successUrl)
    console.log("[v0] Cancel URL:", cancelUrl)

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: product.priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: user.email,
        metadata: {
          userId: user.id,
          productId: product.id,
          hours: product.hours.toString(),
          affiliateId: affiliateId || "",
        },
      })

      console.log("[v0] Checkout session created successfully:", session.id)
      console.log("[v0] Checkout URL:", session.url)

      return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (stripeError: any) {
      console.error("[v0] Stripe API error:", {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
        raw: stripeError.raw,
      })
      return NextResponse.json(
        {
          error: "Stripe checkout failed",
          details: stripeError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Error creating checkout session:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
