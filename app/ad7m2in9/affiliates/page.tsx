"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, DollarSign } from "lucide-react"
import Link from "next/link"

type Affiliate = {
  id: string
  email: string
  name: string | null
  referral_code: string
  commission_rate: number
  total_commission: number
  settled_commission: number
  unsettled_commission: number
  status: string
  created_at: string
  orderCount: number
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
    created_at: string
    users: {
      email: string
      name: string | null
    }
  }
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSettling, setIsSettling] = useState(false)
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [showCommissionsDialog, setShowCommissionsDialog] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null)
  const [newCommissionRate, setNewCommissionRate] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const router = useRouter()

  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin")
    if (!storedAdmin) {
      router.push("/ad7m2in9/login")
      return
    }

    fetchAffiliates()
  }, [statusFilter, router])

  const fetchAffiliates = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/ad7m2in9/affiliates?${params}`)
      if (!response.ok) throw new Error("Failed to fetch affiliates")

      const data = await response.json()
      setAffiliates(data.affiliates)
    } catch (error) {
      console.error("[v0] Error fetching affiliates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCommissions = async (affiliateId: string) => {
    try {
      const response = await fetch(`/api/ad7m2in9/affiliates/${affiliateId}/commissions`)
      if (!response.ok) throw new Error("Failed to fetch commissions")

      const data = await response.json()
      setCommissions(data.commissions)
    } catch (error) {
      console.error("[v0] Error fetching commissions:", error)
    }
  }

  const handleViewCommissions = async (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate)
    await fetchCommissions(affiliate.id)
    setShowCommissionsDialog(true)
  }

  const handleSettleCommissions = async () => {
    if (selectedCommissions.length === 0) return

    setIsSettling(true)
    try {
      const response = await fetch("/api/ad7m2in9/commissions/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionIds: selectedCommissions }),
      })

      if (!response.ok) throw new Error("Failed to settle commissions")

      // Refresh data
      await fetchCommissions(selectedAffiliate!.id)
      await fetchAffiliates()
      setSelectedCommissions([])
      alert("Commissions settled successfully!")
    } catch (error) {
      console.error("[v0] Error settling commissions:", error)
      alert("Failed to settle commissions")
    } finally {
      setIsSettling(false)
    }
  }

  const handleUpdateAffiliate = async () => {
    if (!editingAffiliate) return

    try {
      const updates: any = {}
      if (newCommissionRate) updates.commissionRate = Number.parseFloat(newCommissionRate)
      if (newStatus) updates.status = newStatus

      const response = await fetch("/api/ad7m2in9/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: editingAffiliate.id,
          ...updates,
        }),
      })

      if (!response.ok) throw new Error("Failed to update affiliate")

      await fetchAffiliates()
      setEditingAffiliate(null)
      setNewCommissionRate("")
      setNewStatus("")
      alert("Affiliate updated successfully!")
    } catch (error) {
      console.error("[v0] Error updating affiliate:", error)
      alert("Failed to update affiliate")
    }
  }

  const toggleCommissionSelection = (commissionId: string) => {
    setSelectedCommissions((prev) =>
      prev.includes(commissionId) ? prev.filter((id) => id !== commissionId) : [...prev, commissionId],
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 flex items-center justify-center">
        <p className="text-indigo-900 text-xl">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="outline" className="bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50">
            <Link href="/ad7m2in9">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回控制台
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-indigo-900">分销商管理</h1>
            <p className="text-indigo-700">管理分销商并结算佣金</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/90 backdrop-blur-md border-indigo-200 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-indigo-900">分销商列表</CardTitle>
            <CardDescription className="text-indigo-700">查看和管理所有分销商伙伴</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="text-indigo-900">状态筛选</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white border-indigo-300 text-indigo-900 max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="suspended">暂停</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Affiliates Table */}
            <div className="rounded-lg border border-indigo-200 overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="border-indigo-200 hover:bg-indigo-50/50">
                    <TableHead className="text-indigo-900 font-semibold">分销商</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">推荐码</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">佣金比例</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">总收入</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">未结算</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">订单数</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">状态</TableHead>
                    <TableHead className="text-indigo-900 font-semibold">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.id} className="border-indigo-200 hover:bg-indigo-50/30">
                      <TableCell className="text-indigo-900">
                        <div>
                          <div className="font-medium">{affiliate.name || "未填写"}</div>
                          <div className="text-sm text-indigo-600">{affiliate.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-indigo-900 font-mono">{affiliate.referral_code}</TableCell>
                      <TableCell className="text-indigo-900">{affiliate.commission_rate}%</TableCell>
                      <TableCell className="text-indigo-900">${affiliate.total_commission.toFixed(2)}</TableCell>
                      <TableCell className="text-indigo-900 font-semibold">
                        ${affiliate.unsettled_commission.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-indigo-900">{affiliate.orderCount}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            affiliate.status === "active"
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : affiliate.status === "suspended"
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                          }`}
                        >
                          {affiliate.status === "active" ? "激活" : affiliate.status === "suspended" ? "暂停" : "未激活"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleViewCommissions(affiliate)}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            查看
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAffiliate(affiliate)
                                  setNewCommissionRate(affiliate.commission_rate.toString())
                                  setNewStatus(affiliate.status)
                                }}
                                className="bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                              >
                                编辑
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white border-indigo-200">
                              <DialogHeader>
                                <DialogTitle className="text-indigo-900">编辑分销商</DialogTitle>
                                <DialogDescription className="text-indigo-700">
                                  更新分销商设置
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-indigo-900">佣金比例 (%)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={newCommissionRate}
                                    onChange={(e) => setNewCommissionRate(e.target.value)}
                                    className="bg-white border-indigo-300 text-indigo-900"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-indigo-900">状态</Label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="bg-white border-indigo-300 text-indigo-900">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">激活</SelectItem>
                                      <SelectItem value="suspended">暂停</SelectItem>
                                      <SelectItem value="inactive">未激活</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={handleUpdateAffiliate}
                                  className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white"
                                >
                                  更新分销商
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {affiliates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-indigo-600">暂无分销商</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commissions Dialog */}
        <Dialog open={showCommissionsDialog} onOpenChange={setShowCommissionsDialog}>
          <DialogContent className="bg-white border-indigo-200 max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-indigo-900">
                {selectedAffiliate?.name || selectedAffiliate?.email} 的佣金记录
              </DialogTitle>
              <DialogDescription className="text-indigo-700">管理并结算分销商佣金</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedCommissions.length > 0 && (
                <div className="flex justify-between items-center bg-violet-100 border border-violet-300 rounded-lg p-4">
                  <div className="text-indigo-900">
                    已选择 <span className="font-semibold">{selectedCommissions.length}</span> 笔佣金
                  </div>
                  <Button
                    onClick={handleSettleCommissions}
                    disabled={isSettling}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {isSettling ? "结算中..." : "结算选中项"}
                  </Button>
                </div>
              )}

              <div className="rounded-lg border border-indigo-200 overflow-hidden max-h-96 overflow-y-auto bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="border-indigo-200 hover:bg-indigo-50/50">
                      <TableHead className="text-indigo-900 font-semibold">选择</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">客户</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">订单金额</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">佣金</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">状态</TableHead>
                      <TableHead className="text-indigo-900 font-semibold">日期</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id} className="border-indigo-200 hover:bg-indigo-50/30">
                        <TableCell>
                          {commission.status === "pending" && (
                            <input
                              type="checkbox"
                              checked={selectedCommissions.includes(commission.id)}
                              onChange={() => toggleCommissionSelection(commission.id)}
                              className="w-4 h-4"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-indigo-900">
                          <div>
                            <div className="font-medium">{commission.orders.users.name || "未填写"}</div>
                            <div className="text-sm text-indigo-600">{commission.orders.users.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-indigo-900">${commission.orders.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-indigo-900 font-semibold">${commission.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              commission.status === "settled"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                            }`}
                          >
                            {commission.status === "settled" ? "已结算" : "待结算"}
                          </span>
                        </TableCell>
                        <TableCell className="text-indigo-900">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {commissions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-indigo-600">暂无佣金记录</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
