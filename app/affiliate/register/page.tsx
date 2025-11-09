"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, Mail, User, CheckCircle, Copy } from "lucide-react"
import Link from "next/link"

export default function AffiliateRegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [affiliateData, setAffiliateData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!email) {
      setError("邮箱是必填项")
      setIsLoading(false)
      return
    }

    if (!inviteCode) {
      setError("邀请码是必填项")
      setIsLoading(false)
      return
    }

    if (!password || password.length < 6) {
      setError("密码至少需要6个字符")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "注册失败")
      }

      setAffiliateData(data.affiliate)
      setSuccess(true)

      // 保存到 localStorage
      localStorage.setItem("affiliate", JSON.stringify(data.affiliate))
    } catch (error) {
      setError(error instanceof Error ? error.message : "注册失败")
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = () => {
    if (affiliateData?.referralLink) {
      navigator.clipboard.writeText(affiliateData.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyCode = () => {
    if (affiliateData?.referralCode) {
      navigator.clipboard.writeText(affiliateData.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (success && affiliateData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-2xl w-full">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <CardTitle className="text-3xl text-white">Registration Successful!</CardTitle>
            <CardDescription className="text-white/70 text-lg">
              Welcome to our affiliate program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <div>
                <Label className="text-white/70 text-sm">您的推广码</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={affiliateData.referralCode}
                    readOnly
                    className="bg-white/10 border-white/20 text-white font-mono text-lg font-bold"
                  />
                  <Button
                    onClick={copyCode}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-white/70 text-sm">您的推广链接</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={affiliateData.referralLink}
                    readOnly
                    className="bg-white/10 border-white/20 text-white font-mono"
                  />
                  <Button
                    onClick={copyLink}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">佣金比例</p>
                  <p className="text-2xl font-bold text-green-400">{affiliateData.commissionRate}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">账户状态</p>
                  <p className="text-2xl font-bold text-green-400">已激活</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-white/70 bg-white/5 rounded-lg p-4">
              <p className="text-white font-semibold mb-2">📋 推广指南：</p>
              <p>✓ 分享您的推广链接或推广码给潜在客户</p>
              <p>✓ 客户通过您的链接购买即可获得佣金</p>
              <p>✓ 佣金将在订单完成后自动计入您的账户</p>
              <p>✓ 您可以在仪表板中查看实时收益和订单</p>
            </div>

            <Button
              onClick={() => router.push("/affiliate")}
              className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-6 text-lg"
            >
              Go to Dashboard
            </Button>

            <div className="text-center text-sm text-white/70">
              Need help?{" "}
              <a href="mailto:support@aicounselor.com" className="text-violet-400 hover:text-violet-300">
                Contact us
              </a>
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
          <CardTitle className="text-3xl text-white">Join Affiliate Program</CardTitle>
          <CardDescription className="text-white/70">
            Promote our product and earn generous commissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-3 text-sm text-white/80 bg-white/5 rounded-lg p-4">
            <p className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              <span>Earn up to <strong className="text-green-400">50%</strong> commission on every sale</span>
            </p>
            <p className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              <span>Track your earnings in real-time</span>
            </p>
            <p className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              <span>Get your unique referral link and code</span>
            </p>
            <p className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              <span>Monthly settlements, fast payouts</span>
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-white flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Invite Code *
              </Label>
              <Input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono uppercase"
                placeholder="Enter invite code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white flex items-center">
                <User className="w-4 h-4 mr-2" />
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password * (At least 6 characters)
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Set your password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm Password *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Confirm your password"
              />
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
              {isLoading ? "Registering..." : "Register Now"}
            </Button>

            <div className="text-center text-sm text-white/70">
              Already have an account?{" "}
              <Link href="/affiliate/login" className="text-violet-400 hover:text-violet-300 font-semibold">
                Login here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

