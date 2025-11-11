"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { DollarSign, ShoppingCart, TrendingUp, Copy, CheckCircle, LogOut, LinkIcon, MousePointerClick } from "lucide-react"

type Order = {
  id: string
  amount: number
  currency: string
  hours_purchased: number
  status: string
  created_at: string
  users: {
    email: string
    name: string | null
  }
  commissions: Array<{
    id: string
    amount: number
    status: string
    settled_at: string | null
  }>
}

type Commission = {
  id: string
  amount: number
  status: string
  settled_at: string | null
  created_at: string
  orders: {
    id: string
    amount: number
    hours_purchased: number
    created_at: string
    users: {
      email: string
      name: string | null
    }
  }
}

type Stats = {
  totalCommission: number
  settledCommission: number
  unsettledCommission: number
  totalOrders: number
  totalRevenue: number
  commissionRate: number
  referralCode: string
  totalClicks: number
}

export default function AffiliateDashboard() {
  const [affiliate, setAffiliate] = useState<any>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedAffiliate = localStorage.getItem("affiliate")
    if (!storedAffiliate) {
      router.push("/affiliate/login")
      return
    }

    setAffiliate(JSON.parse(storedAffiliate))
    fetchData()
  }, [router])

  const fetchData = async () => {
    await Promise.all([fetchStats(), fetchOrders(), fetchCommissions()])
    setIsLoading(false)
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/affiliate/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/affiliate/orders")
      if (!response.ok) throw new Error("Failed to fetch orders")

      const data = await response.json()
      setOrders(data.orders)
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
    }
  }

  const fetchCommissions = async () => {
    try {
      const response = await fetch("/api/affiliate/commissions")
      if (!response.ok) throw new Error("Failed to fetch commissions")

      const data = await response.json()
      setCommissions(data.commissions)
    } catch (error) {
      console.error("[v0] Error fetching commissions:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("affiliate")
    router.push("/affiliate/login")
  }

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const baseUrl = window.location.origin
      const referralLink = `${baseUrl}/r/${stats.referralCode}`
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  const referralLink = stats?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${stats.referralCode}`
    : ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Affiliate Dashboard</h1>
            <p className="text-white/70">Welcome back, {affiliate?.name || affiliate?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Referral Link Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <LinkIcon className="w-5 h-5 mr-2" />
              Your Referral Link
            </CardTitle>
            <CardDescription className="text-white/70">
              Share this link to earn {stats?.commissionRate}% commission on every sale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="bg-white/10 border-white/20 text-white font-mono" />
              <Button onClick={copyReferralLink} className="bg-violet-600 hover:bg-violet-700 text-white">
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Total Commission</CardTitle>
                <DollarSign className="w-4 h-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${stats.totalCommission.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Unsettled</CardTitle>
                <TrendingUp className="w-4 h-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${stats.unsettledCommission.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Settled</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${stats.settledCommission.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Total Orders</CardTitle>
                <ShoppingCart className="w-4 h-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Link Clicks</CardTitle>
                <MousePointerClick className="w-4 h-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalClicks || 0}</div>
                <p className="text-xs text-white/50 mt-1">
                  {stats.totalOrders > 0 ? `${((stats.totalOrders / (stats.totalClicks || 1)) * 100).toFixed(1)}% conversion` : "No conversions yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="orders" className="data-[state=active]:bg-white/20 text-white">
              Orders
            </TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-white/20 text-white">
              Commissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Referred Orders</CardTitle>
                <CardDescription className="text-white/70">All orders made through your referral link</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-white/20 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20 hover:bg-white/5">
                        <TableHead className="text-white">Customer</TableHead>
                        <TableHead className="text-white">Amount</TableHead>
                        <TableHead className="text-white">Hours</TableHead>
                        <TableHead className="text-white">Commission</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const commission = order.commissions?.[0]
                        return (
                          <TableRow key={order.id} className="border-white/20 hover:bg-white/5">
                            <TableCell className="text-white">
                              <div>
                                <div className="font-medium">{order.users.name || "N/A"}</div>
                                <div className="text-sm text-white/70">{order.users.email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-white">${order.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-white">{order.hours_purchased}h</TableCell>
                            <TableCell className="text-white">
                              {commission ? `$${commission.amount.toFixed(2)}` : "N/A"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  commission?.status === "settled"
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-yellow-500/20 text-yellow-300"
                                }`}
                              >
                                {commission?.status || "pending"}
                              </span>
                            </TableCell>
                            <TableCell className="text-white">
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {orders.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-white/70">No orders yet. Start sharing your referral link!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Commission History</CardTitle>
                <CardDescription className="text-white/70">Track your earnings and settlement status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-white/20 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20 hover:bg-white/5">
                        <TableHead className="text-white">Order</TableHead>
                        <TableHead className="text-white">Customer</TableHead>
                        <TableHead className="text-white">Order Amount</TableHead>
                        <TableHead className="text-white">Commission</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id} className="border-white/20 hover:bg-white/5">
                          <TableCell className="text-white/70 text-xs font-mono">
                            {commission.orders.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-white">
                            <div>
                              <div className="font-medium">{commission.orders.users.name || "N/A"}</div>
                              <div className="text-sm text-white/70">{commission.orders.users.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">${commission.orders.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-white font-semibold">${commission.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                commission.status === "settled"
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-yellow-500/20 text-yellow-300"
                              }`}
                            >
                              {commission.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-white">
                            {new Date(commission.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {commissions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-white/70">No commissions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
