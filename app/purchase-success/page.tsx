"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loadUserProfile, saveUserProfile } from "@/lib/user-profile"

export default function PurchaseSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<{
    hours: number
    amount: number
    productName: string
  } | null>(null)

  useEffect(() => {
    async function verifyPurchase() {
      if (!sessionId) {
        setError("No session ID provided")
        setLoading(false)
        return
      }

      try {
        console.log("[Purchase Success] Verifying session:", sessionId)

        // 验证支付会话
        const response = await fetch(`/api/verify-purchase?session_id=${sessionId}`)
        
        if (!response.ok) {
          throw new Error("Failed to verify purchase")
        }

        const data = await response.json()
        console.log("[Purchase Success] Verification result:", data)

        if (data.success) {
          setPurchaseDetails({
            hours: data.hours,
            amount: data.amount,
            productName: data.productName,
          })

          // 更新 localStorage 中的用户时间
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser)
              const profile = loadUserProfile(user.email)
              
              // 添加购买的时间
              const updatedProfile = {
                ...profile,
                purchasedHours: (profile?.purchasedHours || 0) + data.hours,
              }
              
              saveUserProfile(user.email, updatedProfile)
              console.log("[Purchase Success] User hours updated:", updatedProfile.purchasedHours)
            } catch (err) {
              console.error("[Purchase Success] Error updating user profile:", err)
            }
          }
        } else {
          setError("Purchase verification failed")
        }
      } catch (err: any) {
        console.error("[Purchase Success] Error:", err)
        setError(err.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    verifyPurchase()
  }, [sessionId])

  const handleContinue = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
            <p className="text-white text-lg">Verifying your purchase...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Purchase Error</CardTitle>
            <CardDescription className="text-white/70">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleContinue} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <CardTitle className="text-3xl text-white mb-2">Purchase Successful!</CardTitle>
          <CardDescription className="text-white/70 text-lg">
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {purchaseDetails && (
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-white/90">
                <span>Product:</span>
                <span className="font-semibold">{purchaseDetails.productName}</span>
              </div>
              <div className="flex justify-between text-white/90">
                <span>Hours Added:</span>
                <span className="font-semibold text-green-400">{purchaseDetails.hours} hours</span>
              </div>
              <div className="flex justify-between text-white/90">
                <span>Amount Paid:</span>
                <span className="font-semibold">${(purchaseDetails.amount / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-white/70">
            <p>✓ Your counseling hours have been added to your account</p>
            <p>✓ You can start using them immediately</p>
            <p>✓ A confirmation email has been sent to you</p>
          </div>

          <Button 
            onClick={handleContinue} 
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-6 text-lg"
          >
            Start Counseling Session
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
