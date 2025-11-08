import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getProductById } from "@/lib/products"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { productId, affiliateCode } = await request.json()

    console.log("[Stripe] Creating checkout session for product:", productId)

    // Get product details
    const product = getProductById(productId)
    if (!product) {
      console.error("[Stripe] Product not found:", productId)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("[Stripe] Product found:", product)

    // Get user from custom session (Google OAuth)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('custom_session')
    
    if (!sessionCookie) {
      console.error("[Stripe] No session cookie found")
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    let user
    try {
      const session = JSON.parse(sessionCookie.value)
      
      // Check if session is expired
      if (new Date(session.expires) < new Date()) {
        console.error("[Stripe] Session expired")
        return NextResponse.json({ error: "Session expired - Please log in again" }, { status: 401 })
      }
      
      user = session.user
    } catch (parseError) {
      console.error("[Stripe] Error parsing session:", parseError)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    if (!user || !user.email) {
      console.error("[Stripe] No user found in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Stripe] User authenticated:", user.email)

    // Affiliate code (simplified for now - can be enhanced later)
    let affiliateId: string | undefined
    if (affiliateCode) {
      affiliateId = affiliateCode
      console.log("[Stripe] Affiliate code provided:", affiliateId)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const successUrl = `${baseUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/payment?canceled=true`

    console.log("[Stripe] Base URL:", baseUrl)
    console.log("[Stripe] Success URL:", successUrl)
    console.log("[Stripe] Cancel URL:", cancelUrl)

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
          userEmail: user.email,
          userName: user.name || "",
          productId: product.id,
          hours: product.hours.toString(),
          affiliateId: affiliateId || "",
        },
      })

      console.log("[Stripe] Checkout session created successfully:", session.id)
      console.log("[Stripe] Checkout URL:", session.url)

      return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (stripeError: any) {
      console.error("[Stripe] Stripe API error:", {
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
    console.error("[Stripe] Error creating checkout session:", {
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
