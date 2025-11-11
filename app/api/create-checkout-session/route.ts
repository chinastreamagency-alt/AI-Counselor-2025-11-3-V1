import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getProductById } from "@/lib/products"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Get user from either custom_session (Google) or user_token (Email)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('custom_session')
    const userTokenCookie = cookieStore.get('user_token')
    
    if (!sessionCookie && !userTokenCookie) {
      console.error("[Stripe] No session found - user not logged in")
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    let user: { id?: string; email: string; name?: string } | null = null

    // Try Google session first
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie.value)
        
        // Check if session is expired
        if (new Date(session.expires) < new Date()) {
          console.error("[Stripe] Google session expired")
        } else {
          user = session.user
          console.log("[Stripe] User authenticated via Google:", user?.email)
        }
      } catch (parseError) {
        console.error("[Stripe] Error parsing Google session:", parseError)
      }
    }

    // Try email/password session if Google session not found
    if (!user && userTokenCookie) {
      try {
        const { jwtVerify } = await import("jose")
        const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")
        
        const { payload } = await jwtVerify(userTokenCookie.value, JWT_SECRET)
        user = {
          id: payload.userId as string,
          email: payload.email as string,
          name: payload.name as string,
        }
        console.log("[Stripe] User authenticated via email:", user.email)
      } catch (jwtError) {
        console.error("[Stripe] Error verifying user token:", jwtError)
      }
    }

    if (!user || !user.email) {
      console.error("[Stripe] No valid user found in any session")
      return NextResponse.json({ error: "Unauthorized - Please log in again" }, { status: 401 })
    }

    console.log("[Stripe] User authenticated:", user.email)

    // 通过推荐码查找推广人员ID
    let affiliateId: string | undefined
    if (affiliateCode) {
      console.log("[Stripe] Affiliate code provided:", affiliateCode)
      
      try {
        const { data: affiliate, error: affiliateError } = await supabaseAdmin
          .from("affiliates")
          .select("id")
          .eq("referral_code", affiliateCode)
          .eq("status", "active")
          .single()

        if (affiliate && !affiliateError) {
          affiliateId = affiliate.id
          console.log("[Stripe] Found affiliate ID:", affiliateId)
        } else {
          console.log("[Stripe] Affiliate not found or inactive for code:", affiliateCode)
        }
      } catch (err) {
        console.error("[Stripe] Error looking up affiliate:", err)
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const successUrl = `${baseUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/payment?canceled=true`

    console.log("[Stripe] Base URL:", baseUrl)
    console.log("[Stripe] Success URL:", successUrl)
    console.log("[Stripe] Cancel URL:", cancelUrl)

    try {
      const session = await stripe.checkout.sessions.create({
        // 暂时只支持信用卡支付，其他支付方式需要在 Stripe Dashboard 中单独启用
        payment_method_types: [
          "card",           // 信用卡/借记卡
        ],
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
        // 防止恶意退款的设置
        payment_intent_data: {
          // 设置描述以帮助防止争议
          description: `AI Counselor - ${product.hours} hours of service for ${user.email}`,
          // 添加 metadata 用于追踪
          metadata: {
            userEmail: user.email,
            productId: product.id,
            hours: product.hours.toString(),
            purchaseTimestamp: new Date().toISOString(),
          },
          // 设置为不可退款（通过业务逻辑和条款执行）
          // 注意：Stripe 本身不支持完全禁用退款，但可以通过 Radar 规则和手动审核来防止
        },
        // 设置客户信息以便后续追踪
        customer_creation: "always",
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
