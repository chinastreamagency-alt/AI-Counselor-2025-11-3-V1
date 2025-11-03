import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, saleId } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    console.log(`[v0] Syncing purchases for user: ${email}`)

    // In a real app, you would:
    // 1. Query database for pending purchases: const purchases = await db.purchases.find({ email, synced: false })
    // 2. Calculate total hours: const totalHours = purchases.reduce((sum, p) => sum + p.hours, 0)
    // 3. Update user account: await db.users.update({ email }, { $inc: { availableHours: totalHours } })
    // 4. Mark purchases as synced: await db.purchases.updateMany({ email }, { synced: true })

    // For demo purposes, return mock data
    const mockPurchases = [
      {
        saleId: saleId || "demo_sale_123",
        hours: 10,
        timestamp: new Date().toISOString(),
        synced: true,
      },
    ]

    return NextResponse.json({
      success: true,
      message: "Purchases synced successfully",
      totalHours: mockPurchases.reduce((sum, p) => sum + p.hours, 0),
      purchases: mockPurchases,
    })
  } catch (error) {
    console.error("[v0] Purchase sync error:", error)
    return NextResponse.json(
      {
        error: "Purchase sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
