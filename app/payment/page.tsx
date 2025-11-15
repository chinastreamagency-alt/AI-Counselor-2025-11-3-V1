"use client"

import { useState, useEffect, Suspense } from "react"
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

function PaymentContent() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get("ref")

  useEffect(() => {
    console.log("[v0] Payment page loaded")
    
    if (affiliateCode) {
      console.log("[v0] Referral code detected:", affiliateCode)
    }

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
  }, [affiliateCode])

  const handlePurchase = async (productId: string) => {
    console.log("[Payment] User clicked purchase button for:", productId)
    setUserEmail(productId)

    try {
      // 检查用户是否登录
      const storedUser = localStorage.getItem("user")
      if (!storedUser) {
        console.error("[Payment] User not logged in")
        alert("Please log in first before making a purchase.")
        setUserEmail(null)
        return
      }

      console.log("[Payment] User is logged in, creating checkout session...")

      // Create checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          affiliateCode: affiliateCode || undefined,
        }),
      })

      console.log("[Payment] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[Payment] Server error:", errorData)
        throw new Error(errorData.error || errorData.details || "Failed to create checkout session")
      }

      const data = await response.json()
      console.log("[Payment] Received data:", data)

      if (!data.url) {
        console.error("[Payment] No checkout URL received")
        throw new Error("No checkout URL received from server")
      }

      console.log("[Payment] Redirecting to Stripe Checkout:", data.url)

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      console.error("[Payment] Error creating checkout session:", error)
      console.error("[Payment] Error details:", error.message)
      alert(`Failed to start checkout: ${error.message}\n\nPlease check the console for details.`)
      setUserEmail(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">Choose Your Plan</h1>
          <p className="text-slate-600 text-lg">Select the perfect plan for your counseling needs</p>
        </div>

        {affiliateCode && (
          <div className="mb-6 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-2 border-violet-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-violet-500 rounded-full p-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-violet-900 font-semibold">推广优惠 🎉</p>
                <p className="text-violet-700 text-sm">您正在通过推荐码购买：<span className="font-mono font-bold">{affiliateCode}</span></p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRODUCTS.map((product) => (
            <Card
              key={product.id}
              className="bg-white/80 backdrop-blur-md border-indigo-200 hover:shadow-xl hover:border-indigo-300 transition-all shadow-lg shadow-indigo-100/50"
            >
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-900">{product.name}</CardTitle>
                <CardDescription className="text-slate-600">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">${(product.priceInCents / 100).toFixed(2)}</div>
                  <div className="text-slate-600 font-medium">
                    ${(product.priceInCents / 100 / product.hours).toFixed(2)} per hour
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-slate-700">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    {product.hours} hour{product.hours > 1 ? "s" : ""} of service
                  </li>
                  <li className="flex items-center text-slate-700">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    24/7 AI counselor access
                  </li>
                  <li className="flex items-center text-slate-700">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    Voice & text support
                  </li>
                  <li className="flex items-center text-slate-700">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    Session memory
                  </li>
                </ul>

                <Button
                  onClick={() => handlePurchase(product.id)}
                  disabled={userEmail === product.id}
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg shadow-lg shadow-indigo-300/50"
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
        <div className="mt-8 bg-white/80 backdrop-blur-md border-indigo-200 rounded-xl p-6 shadow-xl shadow-indigo-100/50">
          <h3 className="text-xl font-bold text-indigo-900 mb-4">💳 Multiple Payment Methods Supported</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 text-center border border-indigo-200">
              <p className="text-indigo-900 font-medium">Credit Card</p>
              <p className="text-slate-600 text-xs">Visa, Mastercard, Amex</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 text-center border border-indigo-200">
              <p className="text-indigo-900 font-medium">PayPal</p>
              <p className="text-slate-600 text-xs">Fast & Secure</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 text-center border border-indigo-200">
              <p className="text-indigo-900 font-medium">WeChat Pay</p>
              <p className="text-slate-600 text-xs">微信支付</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 text-center border border-indigo-200">
              <p className="text-indigo-900 font-medium">Alipay</p>
              <p className="text-slate-600 text-xs">支付宝</p>
            </div>
          </div>
          
          {/* 服务条款 */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
            <h4 className="text-amber-700 font-semibold mb-2">⚠️ Refund Policy - Please Read Carefully</h4>
            <ul className="text-slate-700 text-sm space-y-1">
              <li>• All purchases are <strong>FINAL and NON-REFUNDABLE</strong></li>
              <li>• Once time is added to your account, it <strong>cannot be refunded</strong></li>
              <li>• Purchased time does not expire</li>
              <li>• By purchasing, you agree to these terms</li>
            </ul>
          </div>

          <p className="text-slate-500 text-xs text-center">
            Secure payment powered by Stripe • Your card information is encrypted and never stored on our servers
          </p>
        </div>

        {affiliateCode && (
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Referred by: <span className="text-indigo-700 font-semibold">{affiliateCode}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading payment options...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
