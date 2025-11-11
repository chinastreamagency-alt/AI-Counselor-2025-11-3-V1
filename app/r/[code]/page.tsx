"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

/**
 * 短链接重定向页面
 * 格式: /r/REFERRAL_CODE
 * 自动重定向到: /payment?ref=REFERRAL_CODE
 */
export default function ShortLinkRedirect() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  useEffect(() => {
    if (code) {
      // 验证推荐码并记录点击
      fetch(`/api/affiliate/track-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // 重定向到支付页面
            router.replace(`/payment?ref=${code}`)
          } else {
            // 推荐码无效，重定向到主页
            console.warn("Invalid referral code:", code)
            router.replace("/payment")
          }
        })
        .catch((error) => {
          console.error("Error tracking click:", error)
          // 即使追踪失败也继续重定向
          router.replace(`/payment?ref=${code}`)
        })
    }
  }, [code, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-indigo-900 text-lg font-medium">Redirecting...</p>
      </div>
    </div>
  )
}

