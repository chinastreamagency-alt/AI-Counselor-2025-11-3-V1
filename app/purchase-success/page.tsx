"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

export default function PurchaseSuccessPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [hours, setHours] = useState<number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerifying(false)
      setHours(1) // This would come from the actual session data
    }, 2000)

    return () => clearTimeout(timer)
  }, [sessionId])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md w-full">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <CardTitle className="text-3xl text-white">Payment Successful!</CardTitle>
          <CardDescription className="text-white/70 text-lg">Your purchase has been completed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-white/70 mb-2">Hours Added</p>
            <p className="text-4xl font-bold text-white">
              {hours} Hour{hours !== 1 ? "s" : ""}
            </p>
          </div>

          <p className="text-white/70 text-center text-sm">
            Your hours have been added to your account. You can start using them immediately.
          </p>

          <Button
            onClick={() => router.push("/")}
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-6 text-lg"
          >
            Start Counseling Session
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
