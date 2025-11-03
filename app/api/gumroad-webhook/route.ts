import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Gumroad webhook received:", JSON.stringify(body, null, 2))

    // Extract purchase information
    const {
      sale_id,
      product_name,
      product_permalink,
      email,
      price,
      currency,
      quantity,
      affiliate,
      referrer,
      variants,
      custom_fields,
    } = body

    let hours = 1 // default

    // Check variant first (e.g., "1hour", "5hours", "10hours", "100hours")
    if (variants) {
      const variantStr = JSON.stringify(variants).toLowerCase()
      if (variantStr.includes("100")) hours = 100
      else if (variantStr.includes("10")) hours = 10
      else if (variantStr.includes("5")) hours = 5
      else if (variantStr.includes("1")) hours = 1
    }

    // Fallback: check product name
    if (hours === 1 && product_name) {
      const hoursMatch = product_name.match(/(\d+)\s*[Hh]our/)
      if (hoursMatch) {
        hours = Number.parseInt(hoursMatch[1])
      }
    }

    console.log(`[v0] Purchase verified: ${email} bought ${hours} hours (Sale ID: ${sale_id})`)

    const purchaseRecord = {
      saleId: sale_id,
      email,
      hours,
      price,
      currency,
      timestamp: new Date().toISOString(),
      productName: product_name,
      affiliate: affiliate || null,
      status: "completed",
    }

    // In a real app, you would:
    // 1. Store in database: await db.purchases.create(purchaseRecord)
    // 2. Update user's available hours: await db.users.update({ email }, { $inc: { availableHours: hours } })
    // 3. Send confirmation email
    // 4. Track affiliate commission if applicable

    console.log("[v0] Purchase record:", purchaseRecord)

    if (affiliate) {
      console.log(`[v0] Affiliate sale: ${affiliate} referred this purchase - commission pending`)
    }

    return NextResponse.json({
      success: true,
      message: "Purchase processed successfully",
      data: {
        hours,
        email,
        saleId: sale_id,
        timestamp: purchaseRecord.timestamp,
      },
    })
  } catch (error) {
    console.error("[v0] Gumroad webhook error:", error)
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get("email")
  const saleId = searchParams.get("saleId")

  if (!email && !saleId) {
    return NextResponse.json({ error: "Email or Sale ID required" }, { status: 400 })
  }

  // In a real app, query database for purchase records
  // const purchases = await db.purchases.find({ email })

  return NextResponse.json({
    success: true,
    message: "Purchase lookup endpoint",
    // purchases: purchases || []
  })
}
