import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
})

// Price per hour in cents (e.g., $10.00 = 1000)
export const PRICE_PER_HOUR = 1000 // $10 per hour

export async function createCheckoutSession({
  userId,
  userEmail,
  hours,
  affiliateId,
}: {
  userId: string
  userEmail: string
  hours: number
  affiliateId?: string
}) {
  const amount = hours * PRICE_PER_HOUR

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `AI Counselor - ${hours} Hour${hours > 1 ? "s" : ""}`,
            description: `${hours} hour${hours > 1 ? "s" : ""} of AI counseling service`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?canceled=true`,
    customer_email: userEmail,
    metadata: {
      userId,
      hours: hours.toString(),
      affiliateId: affiliateId || "",
    },
  })

  return session
}
