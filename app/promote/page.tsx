"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, Copy, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function AffiliateRegistrationPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [affiliateData, setAffiliateData] = useState<{
    referralCode: string
    referralLink: string
    commissionRate: number
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setAffiliateData({
        referralCode: data.affiliate.referralCode,
        referralLink: data.affiliate.referralLink,
        commissionRate: data.affiliate.commissionRate,
      })
      setRegistrationSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (affiliateData?.referralLink) {
      navigator.clipboard.writeText(affiliateData.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (registrationSuccess && affiliateData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-2xl w-full">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <CardTitle className="text-3xl text-white">Registration Successful!</CardTitle>
            <CardDescription className="text-white/70 text-lg">Your affiliate account has been created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <div>
                <Label className="text-white/70 text-sm">Your Referral Code</Label>
                <div className="text-2xl font-bold text-white mt-1">{affiliateData.referralCode}</div>
              </div>

              <div>
                <Label className="text-white/70 text-sm">Commission Rate</Label>
                <div className="text-2xl font-bold text-green-400 mt-1">{affiliateData.commissionRate}%</div>
              </div>

              <div>
                <Label className="text-white/70 text-sm mb-2 block">Your Referral Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={affiliateData.referralLink}
                    readOnly
                    className="bg-white/10 border-white/20 text-white font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} className="bg-violet-600 hover:bg-violet-700 text-white">
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                Share your referral link with others. When they make a purchase using your link, you'll earn{" "}
                {affiliateData.commissionRate}% commission on their order!
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                asChild
                className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-6"
              >
                <Link href="/affiliate">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md w-full">
        <CardHeader className="text-center">
          <TrendingUp className="w-16 h-16 text-violet-400 mx-auto mb-4" />
          <CardTitle className="text-3xl text-white">Become an Affiliate</CardTitle>
          <CardDescription className="text-white/70">
            Earn commission by referring customers to our AI counseling service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Name (Optional)
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Your name"
              />
            </div>

            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <ul className="space-y-2 text-green-200 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Earn up to 50% commission on every sale</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Get your unique referral link instantly</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Track your earnings in real-time</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>No approval required - start immediately</span>
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-6"
            >
              {isLoading ? "Creating Account..." : "Create Affiliate Account"}
            </Button>

            <div className="text-center">
              <p className="text-white/70 text-sm">
                Already have an account?{" "}
                <Link href="/affiliate" className="text-violet-400 hover:text-violet-300 underline">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
