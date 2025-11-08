"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ExternalLink } from "lucide-react"
import { PRODUCTS } from "@/lib/products"

const pricingPackages = [
  {
    hours: 1,
    price: 9.99,
    pricePerHour: 9.99,
    popular: false,
    gumroadUrl: "https://chinastream.gumroad.com/l/arina",
  },
  {
    hours: 5,
    price: 44.99,
    pricePerHour: 9.0,
    popular: false,
    savings: "Save 10%",
    gumroadUrl: "https://chinastream.gumroad.com/l/arina",
  },
  {
    hours: 10,
    price: 84.99,
    pricePerHour: 8.5,
    popular: true,
    savings: "Save 15%",
    gumroadUrl: "https://chinastream.gumroad.com/l/arina",
  },
  {
    hours: 100,
    price: 699.99,
    pricePerHour: 7.0,
    popular: false,
    savings: "Save 30%",
    gumroadUrl: "https://chinastream.gumroad.com/l/arina",
  },
]

export default function PaymentPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get("ref")

  useEffect(() => {
    console.log("[v0] Payment page loaded")

    // Get user email from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserEmail(user.email)
        console.log("[v0] User email loaded:", user.email)
      } catch (error) {
        console.error("[v0] Error parsing user:", error)
      }
    }
  }, [])

  const handlePurchase = async (productId: string) => {
    console.log("[v0] User clicked purchase button for:", productId)
    setUserEmail(productId)

    try {
      // Create checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          affiliateCode: affiliateCode || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()
      console.log("[v0] Redirecting to Stripe Checkout:", url)

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error("[v0] Error creating checkout session:", error)
      alert("Failed to start checkout. Please try again.")
      setUserEmail(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Choose Your Plan</h1>
          <p className="text-white/70">Select the perfect plan for your counseling needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRODUCTS.map((product) => (
            <Card
              key={product.id}
              className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all"
            >
              <CardHeader>
                <CardTitle className="text-2xl text-white">{product.name}</CardTitle>
                <CardDescription className="text-white/70">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-white mb-2">${(product.priceInCents / 100).toFixed(2)}</div>
                  <div className="text-white/70">
                    ${(product.priceInCents / 100 / product.hours).toFixed(2)} per hour
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-white/90">
                    <Check className="w-5 h-5 mr-2 text-green-400" />
                    {product.hours} hour{product.hours > 1 ? "s" : ""} of service
                  </li>
                  <li className="flex items-center text-white/90">
                    <Check className="w-5 h-5 mr-2 text-green-400" />
                    24/7 AI counselor access
                  </li>
                  <li className="flex items-center text-white/90">
                    <Check className="w-5 h-5 mr-2 text-green-400" />
                    Voice & text support
                  </li>
                  <li className="flex items-center text-white/90">
                    <Check className="w-5 h-5 mr-2 text-green-400" />
                    Session memory
                  </li>
                </ul>

                <Button
                  onClick={() => handlePurchase(product.id)}
                  disabled={userEmail === product.id}
                  className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-6 text-lg"
                >
                  {userEmail === product.id ? (
                    "Processing..."
                  ) : (
                    <>
                      Purchase Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 支付方式说明 */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border-white/20 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">💳 Multiple Payment Methods Supported</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-white/90 font-medium">Credit Card</p>
              <p className="text-white/60 text-xs">Visa, Mastercard, Amex</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-white/90 font-medium">PayPal</p>
              <p className="text-white/60 text-xs">Fast & Secure</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-white/90 font-medium">WeChat Pay</p>
              <p className="text-white/60 text-xs">微信支付</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-white/90 font-medium">Alipay</p>
              <p className="text-white/60 text-xs">支付宝</p>
            </div>
          </div>
          
          {/* 服务条款 */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-amber-300 font-semibold mb-2">⚠️ Refund Policy - Please Read Carefully</h4>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• All purchases are <strong>FINAL and NON-REFUNDABLE</strong></li>
              <li>• Once time is added to your account, it <strong>cannot be refunded</strong></li>
              <li>• Purchased time does not expire</li>
              <li>• By purchasing, you agree to these terms</li>
            </ul>
          </div>

          <p className="text-white/60 text-xs text-center">
            Secure payment powered by Stripe • Your card information is encrypted and never stored on our servers
          </p>
        </div>

        {affiliateCode && (
          <div className="mt-6 text-center">
            <p className="text-white/70 text-sm">
              Referred by: <span className="text-white font-semibold">{affiliateCode}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
