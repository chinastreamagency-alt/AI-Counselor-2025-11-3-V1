"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, Users, ShoppingCart, TrendingUp, Download, LogOut } from "lucide-react"

type Order = {
  id: string
  user_id: string
  amount: number
  currency: string
  hours_purchased: number
  status: string
  created_at: string
  stripe_payment_intent_id: string
  users: {
    email: string
    name: string | null
  }
  affiliates: {
    referral_code: string
    name: string | null
  } | null
}

type Stats = {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalAffiliates: number
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const router = useRouter()

  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin")
    if (!storedAdmin) {
      router.push("/ad7m2in9/login")
      return
    }

    setAdmin(JSON.parse(storedAdmin))
    fetchData()
  }, [router])

  useEffect(() => {
    if (admin) {
      fetchOrders()
    }
  }, [statusFilter, startDate, endDate, admin])

  const fetchData = async () => {
    await Promise.all([fetchOrders(), fetchStats()])
    setIsLoading(false)
  }

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/ad7m2in9/orders?${params}`)
      if (!response.ok) throw new Error("Failed to fetch orders")

      const data = await response.json()
      setOrders(data.orders)
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/ad7m2in9/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin")
    router.push("/ad7m2in9/login")
  }

  const exportToCSV = () => {
    const headers = ["Order ID", "User Email", "Amount", "Currency", "Hours", "Status", "Date", "Affiliate"]
    const rows = orders.map((order) => [
      order.id,
      order.users.email,
      order.amount,
      order.currency.toUpperCase(),
      order.hours_purchased,
      order.status,
      new Date(order.created_at).toLocaleString(),
      order.affiliates?.referral_code || "N/A",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${new Date().toISOString()}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 flex items-center justify-center">
        <p className="text-indigo-900 text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-indigo-900 mb-2">Admin Dashboard</h1>
            <p className="text-indigo-700">Welcome back, {admin?.username}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur-md border-indigo-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900">${stats.totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-md border-indigo-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700">Total Orders</CardTitle>
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900">{stats.totalOrders}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-md border-indigo-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700">Total Users</CardTitle>
                <Users className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-md border-indigo-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700">Affiliates</CardTitle>
                <TrendingUp className="w-4 h-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900">{stats.totalAffiliates}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Export */}
        <Card className="bg-white/90 backdrop-blur-md border-indigo-200 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-indigo-900">Payment Records</CardTitle>
            <CardDescription className="text-indigo-700">View and filter all payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-indigo-900">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-indigo-300 text-indigo-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-900">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border-indigo-300 text-indigo-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-900">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border-indigo-300 text-indigo-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-indigo-900">Export</Label>
                <Button onClick={exportToCSV} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-lg border border-indigo-200 overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="border-indigo-200 hover:bg-indigo-50/50">
                    <TableHead className="text-indigo-900 font-semibold">User</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">Amount</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">Hours</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">Status</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">Date</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">Affiliate</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">Order ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-indigo-200 hover:bg-indigo-50/30">
                      <TableCell className="text-indigo-900">
                        <div>
                          <div className="font-medium">{order.users.name || "N/A"}</div>
                          <div className="text-sm text-indigo-600">{order.users.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-indigo-900">
                        ${order.amount.toFixed(2)} {order.currency.toUpperCase()}
                      </TableCell>
                      <TableCell className="text-indigo-900">{order.hours_purchased}h</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                : "bg-red-100 text-red-700 border border-red-300"
                          }`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-indigo-900">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-indigo-900">{order.affiliates?.referral_code || "N/A"}</TableCell>
                      <TableCell className="text-indigo-600 text-xs font-mono">
                        {order.stripe_payment_intent_id?.substring(0, 20)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-indigo-600">No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
